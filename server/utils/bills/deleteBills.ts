import type { H3Event } from 'h3'

export const deleteBills = async (event: H3Event, v?: { ids?: number[] }) => {
  const user = await getCurrentUser(event)
  const ids = v?.ids ?? getRouterParamIds(event)

  const isAdmin = !!user.updateAnyBills
  await prisma.bill.updateMany({
    where: {
      id: {
        in: ids
      },
      ...(!isAdmin
        ? {
            authorId: user.id,
            status: {
              in: ['New', 'Cancelled'] as any
            }
          }
        : {})
    },
    data: {
      deletedAt: new Date()
    }
  })

  return {
    message: 'Bills deleted successfully!'
  }
}
