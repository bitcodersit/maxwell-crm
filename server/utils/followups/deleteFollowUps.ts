import type { H3Event } from 'h3'

export const deleteFollowUps = async (event: H3Event, v?: { ids?: number[] }) => {
  const user = await getCurrentUser(event)
  const ids = v?.ids ?? getRouterParamIds(event)
  await prisma.followUp.updateMany({
    where: {
      id: { in: ids },
      ...(!user.deleteAnyFollowUps
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
    message: 'Follow-ups deleted successfully!'
  }
}
