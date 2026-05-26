export default defineEventHandler(async event => {
  await getCurrentUser(event)

  const id = getRouterParam(event, 'id')
  const ids = stringToIds(id)

  if (!ids.length) throw err.notFound()

  return prisma.boardColumn.updateMany({
    where: {
      deletedAt: null,
      id: {
        in: ids
      },
      items: {
        none: {}
      }
    },
    data: {
      deletedAt: new Date()
    }
  })
})
