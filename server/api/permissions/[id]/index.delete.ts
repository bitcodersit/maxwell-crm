export default defineEventHandler(async event => {
  const user = await getCurrentUser(event)
  if (!user.deleteAnyPermissions) {
    throw err.denied()
  }
  const id = getRouterParam(event, 'id')
  const ids = (id || '').split(',').map(Number)
  try {
    const data = await prisma.permission.updateMany({
      where: {
        id: {
          in: ids
        }
      },
      data: {
        deletedAt: new Date()
      }
    })
    return {
      message: 'Permission deleted successfully',
      data
    }
  } catch (error: any) {
    if (error.message.includes('not found')) throw err.notFound()
    throw error
  }
})
