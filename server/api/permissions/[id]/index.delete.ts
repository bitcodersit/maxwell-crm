export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event)
  if (!can(user, ['delete-any-permission'])) {
    throw err.denied()
  }
  const id = getRouterParam(event, 'id')
  const ids = (id || '').split(',').map(Number)
  try {
    const data = await prisma.permission.deleteMany({
      where: {
        id: {
          in: ids,
        },
      },
    })
    return {
      message: 'Permission deleted successfully',
      data,
    }
  } catch (error: any) {
    if (error.message.includes('not found')) throw err.notFound()
    throw error
  }
})
