import { Prisma } from '~~/prisma/client/client'

const zUser = z.object({
  id: z.number().nullish(),
  name: z.string().min(1),
  email: z.email(),
  password: z.string().min(8).nullish(),
  roleIds: z.array(z.number()).nullish(),
})

export default defineEventHandler(async (event) => {
  const { user: sessionUser } = await requireUserSession(event)
  const body = await readBody(event)
  const input = await validate(body, zUser)
  if (input.id) {
    if (!can(sessionUser, ['update-any-users'])) {
      throw err.denied()
    }
    const data: Prisma.UserUpdateInput = {
      name: input.name,
      email: input.email,
      userRoles: input.roleIds
        ? {
            createMany: {
              skipDuplicates: true,
              data: input.roleIds.map((roleId) => ({ roleId })),
            },
            deleteMany: {
              roleId: {
                notIn: input.roleIds,
              },
            },
          }
        : undefined,
    }
    if (input.password) {
      data.password = await hashPassword(input.password)
    }
    const user = await prisma.user.update({
      where: {
        id: input.id,
      },
      data,
      include: {
        userRoles: {
          include: {
            role: true,
          },
        },
      },
    })
    return user
  }

  if (!can(sessionUser, ['create-any-users'])) {
    throw err.denied()
  }

  const password = input.password ? await hashPassword(input.password) : undefined
  const user = await prisma.user.create({
    data: {
      name: input.name,
      email: input.email,
      password,
      userRoles: {
        createMany: {
          data: (input.roleIds || []).map((roleId) => ({ roleId })),
        },
      },
    },
    include: {
      userRoles: {
        include: {
          role: true,
        },
      },
    },
  })

  return user
})
