import type { Prisma } from '~~/prisma/client/client'
import { TaskItemStatus, TaskStatus } from '~~/prisma/client/enums'

const getOwnScope = (userId: number) =>
  ({
    OR: [
      { creatorId: userId },
      { reviewerId: userId },
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

  if (!user.can?.updateAnyTasks && !user.can?.updateOwnTasks) {
    throw err.denied()
  }

  const id = Number(getRouterParam(event, 'id'))
  if (!Number.isInteger(id) || id < 1) {
    throw err.notFound()
  }

  const where = {
    id,
    deletedAt: null,
    ...(!user.can?.updateAnyTasks ? getOwnScope(user.id) : {})
  }

  const existing = await prisma.task.findFirst({
    where,
    select: {
      id: true,
      name: true,
      dueAt: true,
      status: true,
      priority: true,
      description: true,
      reviewerId: true
    }
  })
  if (!existing) throw err.notFound()

  const input = await validate(await readBody(event), zTaskPatch)
  const nextStatus = input.status ?? existing.status

  if (!user.can?.updateAnyTasks && input.status !== undefined && input.status !== existing.status) {
    const statuses: TaskStatus[] = [TaskStatus.TODO, TaskStatus.IN_PROGRESS, TaskStatus.IN_REVIEW]
    if (!statuses.includes(nextStatus)) {
      throw err.unprocessable({
        status: {
          errors: [`You are not allowed to update the status to ${nextStatus}`]
        }
      })
    }
  }

  const canUpdateAnyTasks = !!user.can?.updateAnyTasks
  const data: Prisma.TaskUpdateInput = {
    ...(canUpdateAnyTasks && input.name !== undefined
      ? { name: input.name.trim() || existing.name }
      : {}),
    ...(canUpdateAnyTasks && input.dueAt !== undefined ? { dueAt: input.dueAt } : {}),
    ...(input.status !== undefined ? { status: nextStatus } : {}),
    ...(canUpdateAnyTasks && input.priority !== undefined ? { priority: input.priority } : {}),
    ...(canUpdateAnyTasks && input.description !== undefined
      ? { description: input.description }
      : {}),
    ...(canUpdateAnyTasks && input.status !== undefined && input.status !== existing.status
      ? {
          reviewerId: input.status === TaskStatus.COMPLETED ? user.id : existing.reviewerId
        }
      : {}),
    ...(canUpdateAnyTasks && input.items !== undefined
      ? {
          items: {
            deleteMany: {
              id: {
                notIn: input.items.map(item => item.id)
              }
            },
            upsert: input.items.map((item, sortOrder) => {
              const itemData = {
                sortOrder,
                name: item.name,
                status: item.status,
                completedAt:
                  item.status === TaskItemStatus.COMPLETED ? item.completedAt || new Date() : null,
                completedById:
                  item.status === TaskItemStatus.COMPLETED ? item.completedById || user.id : null
              }
              return {
                where: {
                  id: item.id,
                  taskId: id
                },
                update: itemData,
                create: itemData
              }
            })
          }
        }
      : {}),
    ...(canUpdateAnyTasks && input.users !== undefined
      ? {
          users: {
            deleteMany: {
              userId: {
                notIn: input.users.map(v => v.userId)
              }
            },
            upsert: input.users.map(v => ({
              where: {
                taskId_userId: {
                  taskId: id,
                  userId: v.userId
                }
              },
              update: {},
              create: {
                userId: v.userId
              }
            }))
          }
        }
      : {}),
    ...(canUpdateAnyTasks && input.teams !== undefined
      ? {
          teams: {
            deleteMany: {
              teamId: {
                notIn: input.teams.map(v => v.teamId)
              }
            },
            upsert: input.teams.map(v => ({
              where: {
                taskId_teamId: {
                  taskId: id,
                  teamId: v.teamId
                }
              },
              update: {},
              create: {
                teamId: v.teamId
              }
            }))
          }
        }
      : {})
  }
  return prisma.task.update({
    where,
    data,
    include: TaskInclude
  })
})
