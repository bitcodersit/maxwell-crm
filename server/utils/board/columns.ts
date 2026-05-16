import { computeSortOrder } from './sortOrder'

type TColumnReorderPayload = {
  beforeColumnId?: number | null
  afterColumnId?: number | null
}

const getColumnSortNeighbors = async (
  boardId: number,
  payload: TColumnReorderPayload,
  excludeColumnId?: number
) => {
  const prev = payload.afterColumnId
    ? await prisma.boardColumn.findFirst({
        where: {
          id: payload.afterColumnId,
          boardId,
          deletedAt: null
        },
        select: { id: true, sortOrder: true }
      })
    : null

  const next = payload.beforeColumnId
    ? await prisma.boardColumn.findFirst({
        where: {
          id: payload.beforeColumnId,
          boardId,
          deletedAt: null
        },
        select: { id: true, sortOrder: true }
      })
    : null

  if (payload.afterColumnId && !prev) throw err.notFound('afterColumnId not found')
  if (payload.beforeColumnId && !next) throw err.notFound('beforeColumnId not found')
  if (excludeColumnId && (prev?.id === excludeColumnId || next?.id === excludeColumnId)) {
    throw err.unprocessable({
      column: {
        errors: ['Cannot reorder a column relative to itself']
      }
    })
  }

  return {
    previousSortOrder: prev?.sortOrder ?? null,
    nextSortOrder: next?.sortOrder ?? null
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

export const createBoardColumn = async (boardId: number, data: { name: string; color?: string | null }) => {
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

export const reorderBoardColumn = async (boardId: number, columnId: number, payload: TColumnReorderPayload) => {
  const existing = await prisma.boardColumn.findFirst({
    where: {
      id: columnId,
      boardId,
      deletedAt: null
    },
    select: {
      id: true,
      pinned: true
    }
  })
  if (!existing) throw err.notFound()
  assertColumnReorderAllowed(existing)

  const { previousSortOrder, nextSortOrder } = await getColumnSortNeighbors(boardId, payload, existing.id)
  return prisma.boardColumn.update({
    where: { id: existing.id },
    data: {
      sortOrder: computeSortOrder(previousSortOrder, nextSortOrder)
    }
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
