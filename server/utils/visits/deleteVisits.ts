import type { H3Event } from 'h3'

export const deleteVisits = async (event: H3Event, v?: { ids?: number[] }) => {
  const user = await getCurrentUser(event)
  const ids = v?.ids ?? getRouterParamIds(event)
  await prisma.visit.updateMany({
    where: {
      id: { in: ids },
      ...(!user.deleteAnyVisits
        ? {
            authorId: user.id
          }
        : {})
    },
    data: {
      deletedAt: new Date()
    }
  })

  return {
    message: 'Visits deleted successfully!'
  }
}
