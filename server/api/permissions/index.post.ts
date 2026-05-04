const zPermission = z.object({
  id: z.number().optional(),
  name: z.string().min(1),
  description: z.string().nullish(),
  roleIds: z.array(z.number()).nullish(),
})

export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event)

  const body = await readBody(event)
  const input = await validate(body, zPermission)

  try {
    if (input.id) {
      if (!can(user, ['update-any-permissions'])) {
        throw err.denied()
      }
      return await prisma.permission.update({
        where: {
          id: input.id,
        },
        data: {
          name: input.name,
          description: input.description,
          rolePermissions: input.roleIds
            ? {
                createMany: {
                  data: input.roleIds.map((roleId) => ({ roleId })),
                  skipDuplicates: true,
                },
                deleteMany: {
                  roleId: {
                    notIn: input.roleIds,
                  },
                },
              }
            : undefined,
        },
        include: {
          rolePermissions: {
            include: {
              role: true,
            },
          },
        },
      })
    }
    if (!can(user, ['create-any-permissions'])) {
      throw err.denied()
    }
    return await prisma.permission.create({
      data: {
        name: input.name,
        description: input.description,
        rolePermissions: {
          createMany: {
            data: (input.roleIds || []).map((roleId) => ({ roleId })),
          },
        },
      },
      include: {
        rolePermissions: {
          include: {
            role: true,
          },
        },
      },
    })
  } catch (error: any) {
    const message = error.message
    if (message.includes('not found')) throw err.notFound()
    if (message.includes('permissions_name_key')) {
      throw err.unprocessable({
        name: {
          errors: ['Name must be unique'],
        },
      })
    }
    throw error
  }
})
