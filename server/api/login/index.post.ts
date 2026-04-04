const zLogin = z.object({
  email: z.email(),
  password: z.string().min(8),
})

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  if (session.user) return session

  const body = await readBody(event)
  const input = await validate(body, zLogin)

  const user = await prisma.user.findUnique({
    where: {
      email: input.email,
    },
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
  })

  if (!user) throw err.unauth()

  const verified = await verifyPassword(user.password, input.password)
  if (!verified) throw err.unauth()

  await setUserSession(event, {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      roles: user.userRoles.map((ur) => ur.role.name),
      permissions: user.userRoles.flatMap((ur) =>
        ur.role.rolePermissions.map((rp) => rp.permission.slug)
      ),
    },
  })

  return getUserSession(event)
})
