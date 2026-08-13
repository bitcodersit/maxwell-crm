import type { H3Event } from 'h3'

export const restoreCustomers = async (event: H3Event, options?: { ids?: number[] }) => {
  const user = await getCurrentUser(event)
  if (!user.deleteAnyUsers) throw err.denied()

  const ids = options?.ids ?? getRouterParamIds(event)
  const customerRole = await getOrCreateCustomerRole(prisma as any)

  await prisma.user.updateMany({
    where: {
      id: {
        in: ids
      },
      deletedAt: {
        not: null
      },
      userRoles: {
        some: {
          roleId: customerRole.id
        }
      }
    },
    data: {
      deletedAt: null
    }
  })

  return {
    message: 'Customers restored successfully!'
  }
}
