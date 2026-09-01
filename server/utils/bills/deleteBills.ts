import type { H3Event } from 'h3'

export const deleteBills = async (event: H3Event, v?: { ids?: number[] }) => {
  const user = await getCurrentUser(event)
  const ids = v?.ids ?? getRouterParamIds(event)

  const bills = await prisma.bill.findMany({
    where: {
      id: {
        in: ids
      },
      deletedAt: null
    },
    select: {
      id: true,
      userId: true,
      authorId: true,
      status: true
    }
  })

  const allowedIds: number[] = []
  for (const bill of bills) {
    if (await canDeleteBillRecord(user, bill)) {
      allowedIds.push(bill.id)
    }
  }

  if (allowedIds.length) {
    await prisma.bill.updateMany({
      where: {
        id: {
          in: allowedIds
        }
      },
      data: {
        deletedAt: new Date()
      }
    })
  }

  return {
    message: 'Bills deleted successfully!'
  }
}
