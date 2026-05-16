import { BoardModule } from '~~/prisma/client/enums'
import type { TBoardItemMorph } from './morph'
import { assertEntityExists, assertFkMatchesModule, assertSingleFk } from './morph'
import { computeSortOrder, computeSortOrderForMove } from './sortOrder'

const getItemSortNeighbors = async (
  boardId: number,
  columnId: number,
  payload: {
    beforeItemId?: number | null
    afterItemId?: number | null
  },
  excludeItemId?: number
) => {
  const prev = payload.afterItemId
    ? await prisma.boardItem.findFirst({
        where: {
          id: payload.afterItemId,
          boardId,
          columnId
        },
        select: { id: true, sortOrder: true }
      })
    : null

  const next = payload.beforeItemId
    ? await prisma.boardItem.findFirst({
        where: {
          id: payload.beforeItemId,
          boardId,
          columnId
        },
        select: { id: true, sortOrder: true }
      })
    : null

  // In cross-column drag or rapid reorders, client neighbor ids can become stale.
  // Ignore self-references and fall back to open boundaries instead of failing.
  const safePrev = excludeItemId && prev?.id === excludeItemId ? null : prev
  const safeNext = excludeItemId && next?.id === excludeItemId ? null : next

  return {
    previousSortOrder: safePrev?.sortOrder ?? null,
    nextSortOrder: safeNext?.sortOrder ?? null
  }
}

export const createBoardItem = async (
  board: { id: number; module: BoardModule },
  data: TBoardItemMorph & { columnId?: number | null }
) => {
  assertSingleFk(data)
  assertFkMatchesModule(board.module, data)
  await assertEntityExists(board.module, data)

  const where =
    board.module === BoardModule.LEADS
      ? {
          boardId: board.id,
          leadId: data.leadId ?? null
        }
      : {
          boardId: board.id,
          taskId: data.taskId ?? null
        }

  const existing = await prisma.boardItem.findFirst({
    where
  })

  const targetColumn = data.columnId
    ? await prisma.boardColumn.findFirst({
        where: {
          id: data.columnId,
          boardId: board.id,
          deletedAt: null
        },
        select: { id: true }
      })
    : await prisma.boardColumn.findFirst({
        where: {
          boardId: board.id,
          deletedAt: null
        },
        orderBy: [{ pinned: 'desc' }, { sortOrder: 'asc' }, { id: 'asc' }],
        select: { id: true }
      })

  if (!targetColumn) throw err.notFound('Board column not found')

  const lastItem = await prisma.boardItem.findFirst({
    where: {
      boardId: board.id,
      columnId: targetColumn.id
    },
    orderBy: [{ sortOrder: 'desc' }, { id: 'desc' }],
    select: { sortOrder: true }
  })

  const sortOrder = computeSortOrder(lastItem?.sortOrder ?? null, null)

  if (existing) {
    return prisma.boardItem.update({
      where: { id: existing.id },
      data: {
        columnId: targetColumn.id,
        sortOrder
      }
    })
  }

  return prisma.boardItem.create({
    data: {
      boardId: board.id,
      columnId: targetColumn.id,
      sortOrder,
      leadId: data.leadId ?? null,
      taskId: data.taskId ?? null
    }
  })
}

export const moveBoardItem = async (
  boardId: number,
  itemId: number,
  payload: {
    columnId: number
    beforeItemId?: number | null
    afterItemId?: number | null
  }
) => {
  const [item, targetColumn] = await Promise.all([
    prisma.boardItem.findFirst({
      where: {
        id: itemId,
        boardId
      },
      select: {
        id: true,
        columnId: true,
        sortOrder: true
      }
    }),
    prisma.boardColumn.findFirst({
      where: {
        id: payload.columnId,
        boardId,
        deletedAt: null
      },
      select: { id: true }
    })
  ])

  if (!item) throw err.notFound()
  if (!targetColumn) throw err.notFound('Target column not found')

  const { previousSortOrder, nextSortOrder } = await getItemSortNeighbors(
    boardId,
    targetColumn.id,
    payload,
    item.id
  )

  return prisma.boardItem.update({
    where: { id: item.id },
    data: {
      columnId: targetColumn.id,
      sortOrder: computeSortOrderForMove(item.sortOrder, previousSortOrder, nextSortOrder)
    }
  })
}

export const reorderBoardItem = async (
  boardId: number,
  itemId: number,
  payload: {
    beforeItemId?: number | null
    afterItemId?: number | null
  }
) => {
  const item = await prisma.boardItem.findFirst({
    where: {
      id: itemId,
      boardId
    },
    select: {
      id: true,
      columnId: true,
      sortOrder: true
    }
  })
  if (!item) throw err.notFound()

  const { previousSortOrder, nextSortOrder } = await getItemSortNeighbors(
    boardId,
    item.columnId,
    payload,
    item.id
  )

  return prisma.boardItem.update({
    where: { id: item.id },
    data: {
      sortOrder: computeSortOrderForMove(item.sortOrder, previousSortOrder, nextSortOrder)
    }
  })
}

export const deleteBoardItem = async (boardId: number, itemId: number) => {
  const item = await prisma.boardItem.findFirst({
    where: {
      id: itemId,
      boardId
    },
    select: { id: true }
  })
  if (!item) throw err.notFound()
  await prisma.boardItem.delete({
    where: { id: item.id }
  })
  return { id: item.id }
}
