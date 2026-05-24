export default defineEventHandler(async event => {
  const user = await getCurrentUser(event)
  const billId = getRouterParamId(event)

  const bill = await prisma.bill.findFirst({
    where: {
      id: billId,
      deletedAt: null
    },
    select: {
      id: true,
      status: true,
      authorId: true
    }
  })
  if (!bill) throw err.notFound()

  const scoped = getScopedBill(
    {
      id: bill.id
    },
    user
  )
  const exists = await prisma.bill.findFirst({
    where: scoped,
    select: { id: true }
  })
  if (!exists) throw err.denied()

  return getBillWorkflow({
    status: bill.status,
    isAdmin: !!user.updateAnyBills,
    isAuthor: bill.authorId === user.id
  })
})
