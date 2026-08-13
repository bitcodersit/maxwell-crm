import type { H3Event } from 'h3'

export const restoreUsers = async (event: H3Event, v?: { ids?: number[] }) => {
  const user = await getCurrentUser(event)
  if (!user.deleteAnyUsers) throw err.denied()

  const ids = v?.ids ?? getRouterParamIds(event)
  await prisma.user.updateMany({
    where: {
      id: {
        in: ids
      },
      deletedAt: {
        not: null
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
      deletedAt: null
    }
  })

  return {
    message: 'Users restored successfully!'
  }
}
