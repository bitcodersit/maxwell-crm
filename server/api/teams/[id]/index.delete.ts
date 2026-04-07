export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  const ids = (id || '').split(',').map(Number)
  try {
    const data = await prisma.team.deleteMany({
      where: {
        id: {
          in: ids,
        },
      },
    })
    return {
      message: 'Team deleted successfully',
      data,
    }
  } catch (error: any) {
    if (error.message.includes('not found')) throw err.notFound()
    throw error
  }
})
