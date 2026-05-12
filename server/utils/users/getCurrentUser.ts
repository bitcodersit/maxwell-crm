import type { H3Event } from 'h3'

export type TGetCurrentUserOptions = {
  cache?: boolean
}

export const getCurrentUser = async (event: H3Event, options?: TGetCurrentUserOptions) => {
  const { cache = true } = options ?? {}
  const session = await requireUserSession(event)
  if (cache) return session.user

  const user = await prisma.user.findUnique({
    where: {
      id: session.user.id
    },
    include: {
      userRoles: {
        include: {
          role: {
            include: {
              rolePermissions: {
                include: {
                  permission: true
                }
              }
            }
          }
        }
      }
    }
  })

  if (!user) {
    await clearUserSession(event)
    throw err.unauth()
  }

  return userToSession(user)
}
