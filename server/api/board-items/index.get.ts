const zGetBoardItems = z.object({
  columnId: zId().nullish()
})

export default defineEventHandler(async event => {
  await getCurrentUser(event)

  const query = getQuery(event)
  const input = await validate(query, zGetBoardItems)

  const where: Prisma.BoardItemWhereInput = {}
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
        task: true,
        lead: true
      }
    })
  ])

  return paginate(items, total)
})
