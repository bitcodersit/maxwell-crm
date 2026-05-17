import { getOrCreateCustomerRole } from '~~/server/utils/customerRole'

export default defineEventHandler(async event => {
  const { user } = await requireUserSession(event)
  if (!user.deleteAnyUsers) {
    throw err.denied()
  }

  const id = getRouterParam(event, 'id')
  const ids = (id || '')
    .split(',')
    .map(Number)
    .filter(n => !Number.isNaN(n))
  if (!ids.length) throw err.notFound()

  const customerRole = await getOrCreateCustomerRole(prisma)

  try {
    const data = await prisma.user.updateMany({
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

    if (!data.count) throw err.notFound()

    return {
      message: 'Customer deleted successfully',
      data
    }
  } catch (error: unknown) {
    const knownError = error as { message?: string }
    if (knownError.message?.includes('not found')) throw err.notFound()
    throw error
  }
})
