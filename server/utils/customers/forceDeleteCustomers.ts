import type { H3Event } from 'h3'

export const forceDeleteCustomers = async (event: H3Event) => {
  const customerRole = await getOrCreateCustomerRole(prisma as any)
  return forceDeleteTrashedUsers(event, {
    where: {
      userRoles: {
        some: {
          roleId: customerRole.id
        }
      }
    },
    successMessage: 'Customers permanently deleted!'
  })
}
