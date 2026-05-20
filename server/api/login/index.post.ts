import { isCustomerRoleName } from '~~/server/utils/customerRole'

const zLogin = z.object({
  email: zEmail(),
  password: zPassword()
})

export default defineEventHandler(async event => {
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
    select: {
      id: true,
      name: true,
      email: true,
      password: true,
      deletedAt: true,
      avatar: {
        select: {
          path: true
        }
      },
      userRoles: {
        select: {
          role: {
            select: {
              name: true
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

  const isCustomer = user.userRoles.some(ur => isCustomerRoleName(ur.role?.name))
  if (isCustomer) {
    throw err.unauth('Customer portal is not available yet')
  }

  if (!user.password) {
    throw createError({
      message: 'Account not created with password, please contact support'
    })
  }

  const verified = await verifyPassword(user.password, input.password)
  if (!verified) throw err.unauth()

  await replaceUserSession(event, {
    user: userToSession(user)
  })

  return {
    message: 'Logged in successfully'
  }
})
