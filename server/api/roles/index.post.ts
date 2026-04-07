const zRole = z.object({
  id: z.number().nullish(),
  name: z.string().min(1),
  description: z.string().nullish(),
  permissionIds: z.array(z.number()).nullish(),
})

export default defineEventHandler(async (event) => {
  try {
    const session = await requireUserSession(event)

    const body = await readBody(event)
    const input = await validate(body, zRole)

    if (input.id) {
      if (!can(session, ['update-any-role'])) {
        throw err.denied()
      }
      const role = await prisma.role.update({
        where: { id: input.id },
        data: {
          name: input.name,
          description: input.description,
          rolePermissions: input.permissionIds?.length
            ? {
                createMany: {
                  skipDuplicates: true,
                  data: (input.permissionIds || []).map((permissionId) => ({ permissionId })),
                },
                deleteMany: {
                  permissionId: {
                    notIn: input.permissionIds,
                  },
                },
              }
            : undefined,
        },
        include: {
          rolePermissions: {
            include: {
              permission: true,
            },
          },
        },
      })
      return role
    }

    if (!can(session, ['create-any-role'])) {
      throw err.denied()
    }
    const role = await prisma.role.create({
      data: {
        name: input.name,
        description: input.description,
        rolePermissions: {
          createMany: {
            data: (input.permissionIds || []).map((permissionId) => ({ permissionId })),
          },
        },
      },
      include: {
        rolePermissions: {
          include: {
            permission: true,
          },
        },
      },
    })
    return role
  } catch (error: any) {
    const message = error.message || ''
    if (message.includes('not found')) throw err.notFound()
    if (message.includes('roles_name_key')) {
      throw err.unprocessable({
        name: {
          errors: ['Name is already taken, please try a different name'],
        },
      })
    }
    throw error
  }
})
