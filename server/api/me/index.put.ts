import { deleteAttachmentById } from '../attachments/[id]/index.delete'

const zMeUpdate = z.object({
  name: z.string().min(2).optional(),
  avatarId: z.number().nullable().optional(),
})

export default defineEventHandler(async (event) => {
  const { user: sessionUser } = await requireUserSession(event)
  if (!can(sessionUser, ['update-own-user'])) {
    throw err.denied()
  }

  const body = await readBody(event)
  const input = await validate(body, zMeUpdate)

  if (input.name === undefined && input.avatarId === undefined) {
    throw createError({
      statusCode: 400,
      message: 'No fields to update',
    })
  }

  const existing = await prisma.user.findUnique({
    where: {
      id: sessionUser.id,
    },
    select: {
      avatarId: true,
    },
  })
  if (!existing) {
    throw err.unauth()
  }

  if (input.avatarId) {
    const att = await prisma.attachment.findFirst({
      where: {
        id: input.avatarId,
        deletedAt: null,
      },
    })
    if (!att) {
      throw err.unprocessable({
        avatarId: {
          errors: ['Invalid attachment'],
        },
      })
    }
  }

  if (input.avatarId && existing.avatarId && existing.avatarId !== input.avatarId) {
    await deleteAttachmentById(event, existing.avatarId)
  }

  const user = await prisma.user.update({
    where: {
      id: sessionUser.id,
    },
    data: {
      ...(input.name ? { name: input.name } : {}),
      ...(input.avatarId ? { avatarId: input.avatarId } : {}),
    },
    include: {
      avatar: true,
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

  await replaceUserSession(event, {
    user: userToSession(user),
  })

  return getUserSession(event)
})
