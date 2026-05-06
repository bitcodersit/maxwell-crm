export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event)
  if (!can(user, ['delete-any-users'])) {
    throw err.denied()
  }
  const id = getRouterParam(event, 'id')
  const ids = (id || '')
    .split(',')
    .map(Number)
    .filter((n) => !Number.isNaN(n))
  if (!ids.length) throw err.notFound()
  try {
    const data = await prisma.user.updateMany({
      where: {
        id: {
          in: ids,
        },
      },
      data: {
        deletedAt: new Date(),
      },
    })
    return {
      message: 'User deleted successfully',
      data,
    }
  } catch (error: any) {
    if (error.message?.includes('not found')) throw err.notFound()
    throw error
  }
})
