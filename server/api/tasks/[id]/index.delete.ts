import type { Prisma } from '~~/prisma/client/client'

const getOwnScope = (userId: number) =>
  ({
    OR: [
      { creatorId: userId },
      { reviewerId: userId },
      { submitterId: userId },
      { users: { some: { userId } } },
      {
        teams: {
          some: {
            team: {
              members: {
                some: {
                  userId
                }
              }
            }
          }
        }
      }
    ]
  }) satisfies Prisma.TaskWhereInput

export default defineEventHandler(async event => {
  const { user } = await requireUserSession(event)
  const canDeleteAny = !!user.deleteAnyTasks
  const canDeleteOwn = !!user.deleteOwnTasks
  if (!canDeleteAny && !canDeleteOwn) {
    throw err.denied()
  }

  const idParam = getRouterParam(event, 'id')
  const ids = (idParam || '')
    .split(',')
    .map(v => Number(v.trim()))
    .filter(v => Number.isInteger(v) && v > 0)

  if (!ids.length) throw err.notFound()

  const now = new Date()
  if (canDeleteAny) {
    const data = await prisma.task.updateMany({
      where: {
        id: {
          in: ids
        },
        deletedAt: null
      },
      data: {
        deletedAt: now
      }
    })
    return {
      message: 'Task deleted successfully',
      data
    }
  }

  const success: number[] = []
  const skipped: { id: number; error: string }[] = []

  for (const id of [...new Set(ids)]) {
    const where: Prisma.TaskWhereInput = {
      id,
      deletedAt: null,
      ...getOwnScope(user.id)
    }
    const updated = await prisma.task.updateMany({
      where,
      data: {
        deletedAt: now
      }
    })
    if (updated.count > 0) {
      success.push(id)
    } else {
      skipped.push({
        id,
        error: 'task not found or no access'
      })
    }
  }

  return {
    message: 'Task delete completed',
    success,
    skipped
  }
})
