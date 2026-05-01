const zLogin = z.object({
  email: z.email(),
  password: z.string().min(8)
})

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  if (session.user) {
    throw createError({
      statusCode: 400,
      message: 'Already logged in, please logout first'
    })
  }

  const body = await readBody(event)
  const input = await validate(body, zLogin)

  const user = await prisma.user.findUnique({
    where: {
      email: input.email
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

  if (!user)
    throw err.unprocessable({
      email: {
        errors: ['Invalid email or password']
      }
    })

  if (user.deletedAt)
    throw createError({
      message: 'Account deleted, please contact support'
    })

  if (!user.password) {
    throw createError({
      message: 'Account not created with password, please contact support'
    })
  }

  const verified = await verifyPassword(user.password, input.password)
  if (!verified) throw err.unauth()

  await setUserSession(event, {
    user: userToSession(user)
  })

  return getUserSession(event)
})
