import { computeSortOrder, computeSortOrderForMove } from './sortOrder'

type TColumnReorderPayload = {
  beforeColumnId?: number | null
  afterColumnId?: number | null
}

const resolveColumnInsertBounds = async (
  boardId: number,
  columnId: number,
  payload: TColumnReorderPayload
) => {
  const columns = await prisma.boardColumn.findMany({
    where: {
      boardId,
      deletedAt: null
    },
    orderBy: [{ pinned: 'desc' }, { sortOrder: 'asc' }, { id: 'asc' }],
    select: {
      id: true,
      sortOrder: true,
      pinned: true
    }
  })

  const moving = columns.find(column => column.id === columnId)
  if (!moving) return null

  const pinned = columns.filter(column => column.pinned)
  const unpinnedOthers = columns.filter(column => !column.pinned && column.id !== columnId)

  let insertAt = unpinnedOthers.length

  if (payload.beforeColumnId) {
    const beforeIdx = unpinnedOthers.findIndex(column => column.id === payload.beforeColumnId)
    if (beforeIdx >= 0) insertAt = beforeIdx
  }

  if (payload.afterColumnId) {
    const afterIdx = unpinnedOthers.findIndex(column => column.id === payload.afterColumnId)
    if (afterIdx >= 0) insertAt = afterIdx + 1
  }

  if (payload.afterColumnId && payload.beforeColumnId) {
    const afterIdx = unpinnedOthers.findIndex(column => column.id === payload.afterColumnId)
    const beforeIdx = unpinnedOthers.findIndex(column => column.id === payload.beforeColumnId)
    if (afterIdx >= 0 && beforeIdx === afterIdx + 1) {
      insertAt = beforeIdx
    }
  }

  const previousSortOrder =
    insertAt > 0
      ? (unpinnedOthers[insertAt - 1]?.sortOrder ?? pinned.at(-1)?.sortOrder ?? null)
      : (pinned.at(-1)?.sortOrder ?? null)

  const nextSortOrder =
    insertAt < unpinnedOthers.length ? (unpinnedOthers[insertAt]?.sortOrder ?? null) : null

  return {
    moving,
    previousSortOrder,
    nextSortOrder
  }
}

export const assertColumnReorderAllowed = (column: { pinned: boolean }) => {
  if (column.pinned) {
    throw err.unprocessable({
      pinned: {
        errors: ['Pinned columns cannot be reordered']
      }
    })
  }
}

export const createBoardColumn = async (
  boardId: number,
  data: { name: string; color?: string | null }
) => {
  const lastColumn = await prisma.boardColumn.findFirst({
    where: {
      boardId,
      deletedAt: null
    },
    orderBy: [{ pinned: 'desc' }, { sortOrder: 'desc' }, { id: 'desc' }],
    select: { sortOrder: true }
  })

  return prisma.boardColumn.create({
    data: {
      boardId,
      name: data.name,
      color: data.color ?? null,
      pinned: false,
      sortOrder: computeSortOrder(lastColumn?.sortOrder ?? null, null)
    }
  })
}

export const updateBoardColumn = async (
  boardId: number,
  columnId: number,
  data: {
    name?: string
    color?: string | null
    pinned?: boolean
  }
) => {
  const existing = await prisma.boardColumn.findFirst({
    where: {
      id: columnId,
      boardId,
      deletedAt: null
    }
  })
  if (!existing) throw err.notFound()

  const update: {
    name?: string
    color?: string | null
    pinned?: boolean
    sortOrder?: string
  } = {}

  if (data.name !== undefined) update.name = data.name
  if (data.color !== undefined) update.color = data.color

  if (data.pinned !== undefined && data.pinned !== existing.pinned) {
    const edgeColumn = await prisma.boardColumn.findFirst({
      where: {
        boardId,
        deletedAt: null,
        pinned: data.pinned,
        id: {
          not: existing.id
        }
      },
      orderBy: {
        sortOrder: data.pinned ? 'asc' : 'desc'
      },
      select: { sortOrder: true }
    })

    update.pinned = data.pinned
    update.sortOrder = data.pinned
      ? computeSortOrder(null, edgeColumn?.sortOrder ?? null)
      : computeSortOrder(edgeColumn?.sortOrder ?? null, null)
  }

  return prisma.boardColumn.update({
    where: { id: existing.id },
    data: update
  })
}

export const reorderBoardColumn = async (
  boardId: number,
  columnId: number,
  payload: TColumnReorderPayload
) => {
  const bounds = await resolveColumnInsertBounds(boardId, columnId, payload)
  if (!bounds) throw err.notFound()

  assertColumnReorderAllowed(bounds.moving)

  const sortOrder = computeSortOrderForMove(
    bounds.moving.sortOrder,
    bounds.previousSortOrder,
    bounds.nextSortOrder
  )

  return prisma.boardColumn.update({
    where: { id: bounds.moving.id },
    data: { sortOrder }
  })
}

export const deleteBoardColumn = async (
  boardId: number,
  columnId: number,
  payload: {
    moveToColumnId?: number | null
  }
) => {
  const existing = await prisma.boardColumn.findFirst({
    where: {
      id: columnId,
      boardId,
      deletedAt: null
    },
    select: { id: true }
  })
  if (!existing) throw err.notFound()

  const fallback = payload.moveToColumnId
    ? await prisma.boardColumn.findFirst({
        where: {
          id: payload.moveToColumnId,
          boardId,
          deletedAt: null
        },
        select: { id: true }
      })
    : await prisma.boardColumn.findFirst({
        where: {
          boardId,
          deletedAt: null,
          id: {
            not: existing.id
          }
        },
        orderBy: [{ pinned: 'desc' }, { sortOrder: 'asc' }],
        select: { id: true }
      })

  if (!fallback) {
    throw err.unprocessable({
      moveToColumnId: {
        errors: ['A destination column is required']
      }
    })
  }

  return prisma.$transaction(async tx => {
    await tx.boardItem.updateMany({
      where: { columnId: existing.id },
      data: { columnId: fallback.id }
    })
    await tx.boardColumn.update({
      where: { id: existing.id },
      data: { deletedAt: new Date() }
    })
    return {
      movedToColumnId: fallback.id
    }
  })
}
