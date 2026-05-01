export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const cache = query.cache ? isTrue(query.cache) : true

  const session = await requireUserSession(event)
  if (cache) return session

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
})
