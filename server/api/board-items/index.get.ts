const zGetBoardItems = z.object({
  boardId: z
    .string()
    .refine(val => Number.isInteger(Number(val)), 'Board ID must be a number')
    .nullish(),
  columnId: z
    .string()
    .refine(val => Number.isInteger(Number(val)), 'Column ID must be a number')
    .nullish()
})

export default defineEventHandler(async event => {
  await requireUserSession(event)

  const query = getQuery(event)
  const input = await validate(query, zGetBoardItems)

  const where: Prisma.BoardItemWhereInput = {}
  if (input.boardId) where.boardId = Number(input.boardId)
  if (input.columnId) where.columnId = Number(input.columnId)

  const { skip, take, paginate } = getPagination(query)

  const [total, items] = await prisma.$transaction([
    prisma.boardItem.count({ where }),
    prisma.boardItem.findMany({
      skip,
      take,
      where,
      orderBy: {
        sortOrder: 'asc'
      },
      include: {
        task: true
      }
    })
  ])

  return paginate(items, total)
})
