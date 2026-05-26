import type { H3Event } from 'h3'

export const deleteUsers = async (event: H3Event, v?: { ids?: number[] }) => {
  const user = await getCurrentUser(event)
  if (!user.deleteAnyUsers) throw err.denied()

  const ids = v?.ids ?? getRouterParamIds(event)
  await prisma.user.updateMany({
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
    message: 'Users deleted successfully!'
  }
}
