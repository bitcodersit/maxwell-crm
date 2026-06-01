export default defineEventHandler(async event => {
  const user = await getCurrentUser(event)
  if (!user.deleteAnyRoles) {
    throw err.denied()
  }
  const id = getRouterParam(event, 'id')
  const ids = (id || '')
    .split(',')
    .map(Number)
    .filter(n => !Number.isNaN(n))
  if (!ids.length) throw err.notFound()
  try {
    const data = await prisma.role.updateMany({
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
      message: 'Role deleted successfully',
      data
    }
  } catch (error: any) {
    if (error.message?.includes('not found')) throw err.notFound()
    throw error
  }
})
