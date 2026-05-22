import type { H3Event } from 'h3'
import { capitalize } from 'vue'

const name = 'getCurrentUser'

export const getCurrentUserCached = defineCachedFunction(
  async (_: H3Event, id: number) => {
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        ...selectUserBase,
        userRoles: {
          select: {
            role: {
              select: {
                name: true,
                rolePermissions: {
                  select: {
                    permission: {
                      select: {
                        name: true
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    })
    if (!user) throw err.unauth()
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      avatar: user.avatar
        ? {
            path: user.avatar?.path
          }
        : undefined,
      ...user.userRoles?.reduce(
        (acc, ur) => {
          acc[`is${ur.role?.name?.replace(/\s/g, '')}`] = true
          return acc
        },
        {} as Record<string, boolean>
      ),
      ...(
        user.userRoles?.flatMap(
          ur => ur.role?.rolePermissions?.map(rp => rp.permission?.name).filter(Boolean) ?? []
        ) ?? []
      ).reduce((acc, permission) => {
        const [operation, subject, module] = (permission as string).split('-')
        if (operation && subject && module) {
          ;(acc as any)[`${operation}${capitalize(subject)}${capitalize(module)}`] = true
        }
        return acc
      }, {})
    } as TUser
  },
  {
    name,
    maxAge: 60, // seconds,
    getKey: (_, id) => `${name}(${id})`
  }
)

export const getCurrentUser = async (event: H3Event) => {
  return getCurrentUserCached(event, (await requireUserSession(event)).user.id)
}
