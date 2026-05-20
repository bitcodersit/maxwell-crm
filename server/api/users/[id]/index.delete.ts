import { CUSTOMER_ROLE_NAME } from '~~/server/utils/customerRole'

export default defineEventHandler(async event => {
  const user = await getCurrentUser(event)
  if (!user.deleteAnyUsers) {
    throw err.denied()
  }
  const id = getRouterParam(event, 'id')
  const ids = (id || '')
    .split(',')
    .map(Number)
    .filter(n => !Number.isNaN(n))
  if (!ids.length) throw err.notFound()
  try {
    const data = await prisma.user.updateMany({
      where: {
        id: {
          in: ids
        },
        userRoles: {
          none: {
            role: {
              name: CUSTOMER_ROLE_NAME
            }
          }
        }
      },
      data: {
        deletedAt: new Date()
      }
    })
    return {
      message: 'User deleted successfully',
      data
    }
  } catch (error: any) {
    if (error.message?.includes('not found')) throw err.notFound()
    throw error
  }
})
