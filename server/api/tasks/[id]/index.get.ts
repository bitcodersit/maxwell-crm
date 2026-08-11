import type { Prisma } from '~~/prisma/client/client'
import { TaskKind } from '~~/prisma/client/enums'

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
  const user = await getCurrentUser(event)
  if (!user.readAnyTasks || !user.readOwnTasks) {
    throw err.denied()
  }

  const id = Number(getRouterParam(event, 'id'))
  if (!Number.isInteger(id) || id < 1) {
    throw err.notFound()
  }

  const where: Prisma.TaskWhereInput = {
    id,
    deletedAt: null,
    kind: TaskKind.TASK,
    ...(user.readAnyTasks ? {} : getOwnScope(user.id))
  }

  const task = await prisma.task.findFirst({
    where,
    include: TaskInclude
  })

  if (!task) throw err.notFound()
  return task
})
