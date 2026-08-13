import type { H3Event } from 'h3'
import type { Prisma } from '~~/prisma/client/client'

export const forceDeleteTrashedUsers = async (
  event: H3Event,
  options: {
    where: Prisma.UserWhereInput
    successMessage: string
  }
) => {
  const user = await getCurrentUser(event)
  if (!user.deleteAnyUsers) throw err.denied()

  const ids = getRouterParamIds(event)
  const targets = await prisma.user.findMany({
    where: {
      ...options.where,
      id: {
        in: ids.filter(id => id !== user.id)
      },
      deletedAt: {
        not: null
      }
    },
    select: {
      id: true
    }
  })
  const targetIds = targets.map(target => target.id)
  if (!targetIds.length) {
    return {
      message: options.successMessage
    }
  }

  try {
    await prisma.$transaction([
      prisma.token.deleteMany({
        where: {
          modelType: 'USER',
          modelId: {
            in: targetIds
          }
        }
      }),
      prisma.user.deleteMany({
        where: {
          id: {
            in: targetIds
          }
        }
      })
    ])
  } catch {
    throw createError({
      statusCode: 409,
      message:
        'This record cannot be permanently deleted because it is still referenced by other data.'
    })
  }

  return {
    message: options.successMessage
  }
}
