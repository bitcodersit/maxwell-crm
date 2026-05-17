export default defineEventHandler(async event => {
  await requireUserSession(event)

  const param = getRouterParam(event, 'id')
  const where: Prisma.BoardWhereInput = {
    deletedAt: null
  }

  const id = Number(param)
  if (!isNaN(id)) where.id = id
  else where.name = param

  const board = await prisma.board.findFirst({
    where,
    include: {
      columns: true
    }
  })

  if (!board) throw err.notFound()
  return board
})
