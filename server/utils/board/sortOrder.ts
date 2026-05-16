import { generateKeyBetween, generateNKeysBetween } from 'fractional-indexing'

type TMaybeString = string | null | undefined

export const computeSortOrder = (previous: TMaybeString, next: TMaybeString) => {
  const key = generateKeyBetween(previous ?? null, next ?? null)
  if (!key) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Unable to compute sortOrder'
    })
  }
  return key
}

/** When the naive between-key equals current, nudge so reorder actually moves in key space. */
export const computeSortOrderForMove = (
  current: TMaybeString,
  previous: TMaybeString,
  next: TMaybeString
) => {
  let key = computeSortOrder(previous, next)
  if (current && key === current) {
    if (next) {
      key = computeSortOrder(current, next)
    } else if (previous) {
      key = computeSortOrder(previous, current)
    }
  }
  return key
}

export const computeSortOrderBatch = (count: number): string[] => {
  if (!count) return []
  const keys = generateNKeysBetween(null, null, count)
  return keys.map((value, index) => {
    if (value) return value
    return computeSortOrder(keys[index - 1] ?? null, null)
  })
}

export const rebalanceColumn = async (columnId: number) => {
  const items = await prisma.boardItem.findMany({
    where: { columnId },
    orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
    select: { id: true }
  })
  if (!items.length) return

  const keys = computeSortOrderBatch(items.length)
  await prisma.$transaction(
    items.map((item, index) =>
      prisma.boardItem.update({
        where: { id: item.id },
        data: { sortOrder: keys[index] }
      })
    )
  )
}

export const rebalanceBoardColumns = async (boardId: number) => {
  const columns = await prisma.boardColumn.findMany({
    where: {
      boardId,
      deletedAt: null
    },
    orderBy: [{ pinned: 'desc' }, { sortOrder: 'asc' }, { id: 'asc' }],
    select: { id: true }
  })
  if (!columns.length) return

  const keys = computeSortOrderBatch(columns.length)
  await prisma.$transaction(
    columns.map((column, index) =>
      prisma.boardColumn.update({
        where: { id: column.id },
        data: { sortOrder: keys[index] }
      })
    )
  )
}
