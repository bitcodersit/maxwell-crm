export default defineEventHandler(async (event) => {
  // const session = await requireUserSession(event)
  // if (!can(session, ['read-any-user'])) {
  //   throw err.denied()
  // }

  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      createdAt: true,
      updatedAt: true,
      deletedAt: true,
      userRoles: {
        select: {
          id: true,
          role: {
            select: {
              id: true,
              name: true,
              rolePermissions: {
                select: {
                  id: true,
                  permission: {
                    select: {
                      id: true,
                      name: true,
                    },
                  },
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
