import { Prisma } from '~~/prisma/client/client'
import { getOrCreateCustomerRole } from '~~/server/utils/customerRole'

const zCustomer = z.object({
  id: z.number().nullish(),
  name: z.string().min(1),
  email: z.email().nullish(),
  phone: z.string().min(4).max(32)
})

export default defineEventHandler(async (event) => {
  const { user: sessionUser } = await requireUserSession(event)

  const body = await readBody(event)
  const input = await validate(body, zCustomer)

  try {
    if (input.id) {
      if (!can(sessionUser, ['update-any-users'])) {
        throw err.denied()
      }

      const customerRole = await getOrCreateCustomerRole(prisma)
      const existing = await prisma.user.findFirst({
        where: {
          id: input.id,
          deletedAt: null,
          userRoles: {
            some: {
              roleId: customerRole.id
            }
          }
        },
        select: {
          id: true
        }
      })
      if (!existing) throw err.notFound()

      const customer = await prisma.user.update({
        where: {
          id: input.id
        },
        data: {
          name: input.name,
          email: input.email || null,
          phone: input.phone,
          userRoles: {
            createMany: {
              skipDuplicates: true,
              data: [{ roleId: customerRole.id }]
            },
            deleteMany: {
              roleId: {
                not: customerRole.id
              }
            }
          }
        },
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          avatarId: true,
          createdAt: true,
          updatedAt: true,
          userRoles: {
            select: {
              id: true,
              role: {
                select: {
                  id: true,
                  name: true
                }
              }
            }
          }
        }
      })

      return customer
    }

    if (!can(sessionUser, ['create-any-users'])) {
      throw err.denied()
    }

    const customerRole = await getOrCreateCustomerRole(prisma)
    const customer = await prisma.user.create({
      data: {
        name: input.name,
        email: input.email || null,
        phone: input.phone,
        userRoles: {
          create: {
            roleId: customerRole.id
          }
        }
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        avatarId: true,
        createdAt: true,
        updatedAt: true,
        userRoles: {
          select: {
            id: true,
            role: {
              select: {
                id: true,
                name: true
              }
            }
          }
        }
      }
    })

    return customer
  } catch (error: unknown) {
    const knownError = error as {
      message?: string
      meta?: {
        target?: string[] | string
      }
    }
    const message = knownError?.message || ''
    if (message.includes('users_email_key')) {
      throw err.unprocessable({
        email: {
          errors: ['Email is already taken']
        }
      })
    }
    if (message.includes('users_phone_key')) {
      throw err.unprocessable({
        phone: {
          errors: ['Phone number is already used by another customer']
        }
      })
    }
    if (message.includes('not found')) throw err.notFound()
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      const target = Array.isArray(error.meta?.target) ? error.meta?.target.join(',') : ''
      if (target.includes('email')) {
        throw err.unprocessable({
          email: {
            errors: ['Email is already taken']
          }
        })
      }
      if (target.includes('phone')) {
        throw err.unprocessable({
          phone: {
            errors: ['Phone number is already used by another customer']
          }
        })
      }
    }
    throw error
  }
})
