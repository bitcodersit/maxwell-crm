import type { H3Event } from 'h3'

export const deleteComments = async (event: H3Event, v?: { ids?: number[] }) => {
  const user = await getCurrentUser(event)
  const ids = v?.ids ?? getRouterParamIds(event)
  await prisma.comment.updateMany({
    where: {
      id: { in: ids },
      ...(!user.deleteAnyComments
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
    message: 'Comments deleted successfully!'
  }
}
