import type { Prisma, PrismaClient } from '~~/prisma/client/client'

export const CUSTOMER_ROLE_NAME = 'Customer'

type TRoleClient = PrismaClient | Prisma.TransactionClient

export const isCustomerRoleName = (name?: string | null) => {
  return name?.toLowerCase() === CUSTOMER_ROLE_NAME.toLowerCase()
}

export const getOrCreateCustomerRole = async (client: TRoleClient) => {
  return client.role.upsert({
    where: {
      name: CUSTOMER_ROLE_NAME
    },
    update: {},
    create: {
      name: CUSTOMER_ROLE_NAME,
      description: 'Customer account used for lead and CRM management'
    }
  })
}
