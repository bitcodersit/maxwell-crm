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
    ...(user.readAnyTasks ? {} : getOwnScope(user.id))
  }

  const task = await prisma.task.findFirst({
    where,
    include: TaskInclude
  })

  if (!task) throw err.notFound()
  return task
})
