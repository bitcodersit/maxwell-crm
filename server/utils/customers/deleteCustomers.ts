import type { H3Event } from 'h3'

export const deleteCustomers = async (event: H3Event, options?: { ids?: number[] }) => {
  const user = await getCurrentUser(event)
  if (!user.deleteAnyUsers) throw err.denied()

  const ids = options?.ids ?? getRouterParamIds(event)
  const customerRole = await getOrCreateCustomerRole(prisma as any)

  await prisma.user.updateMany({
    where: {
      id: {
        in: ids
      },
      userRoles: {
        some: {
          roleId: customerRole.id
        }
      }
    },
    data: {
      deletedAt: new Date()
    }
  })

  return {
    message: 'Customers deleted successfully!'
  }
}
