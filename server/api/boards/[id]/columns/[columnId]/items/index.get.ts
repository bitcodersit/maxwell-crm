export default defineEventHandler(async event => {
  await requireUserSession(event)

  const query = getQuery(event)
  const boardId = getRouterParam(event, 'id')
  const columnId = getRouterParam(event, 'columnId')
  const where: Prisma.BoardItemWhereInput = {
    boardId: Number(boardId),
    columnId: Number(columnId)
  }

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
