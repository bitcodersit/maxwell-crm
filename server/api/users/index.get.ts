export default defineEventHandler(async (event) => {
  // const session = await requireUserSession(event)
  // if (!can(session, ['read-any-user'])) {
  //   throw err.denied()
  // }

  const users = await prisma.user.findMany({
    include: {
      userRoles: {
        include: {
          role: {
            include: {
              rolePermissions: {
                include: {
                  permission: true,
                },
              },
            },
          },
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  })
  return users
})
