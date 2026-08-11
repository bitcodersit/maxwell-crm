import type { Prisma } from '~~/prisma/client/client'
import type { TZTaskItem } from '~~/server/utils/tasks'
import { TaskItemStatus, TaskKind, TaskStatus } from '~~/prisma/client/enums'

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

  if (!user.updateAnyTasks && !user.updateOwnTasks) {
    throw err.denied()
  }

  const id = Number(getRouterParam(event, 'id'))
  if (!Number.isInteger(id) || id < 1) {
    throw err.notFound()
  }

  const where = {
    id,
    deletedAt: null,
    kind: TaskKind.TASK,
    ...(!user.updateAnyTasks ? getOwnScope(user.id) : {})
  }

  const existing = await prisma.task.findFirst({
    where,
    select: {
      id: true,
      name: true,
      dueAt: true,
      status: true,
      priority: true,
      reviewedAt: true,
      submittedAt: true,
      description: true,
      reviewerId: true,
      submitterId: true
    }
  })
  if (!existing) throw err.notFound()

  const input = await validate(await readBody(event), zTaskPatch)

  if (!user.updateAnyTasks && input.status && input.status !== existing.status) {
    const statuses: TaskStatus[] = [TaskStatus.TODO, TaskStatus.IN_PROGRESS, TaskStatus.IN_REVIEW]
    if (!statuses.includes(input.status)) {
      throw err.unprocessable({
        status: {
          errors: [`You are not allowed to update the status to ${input.status}`]
        }
      })
    }
  }

  const getItemUpdateCommon = (item: TZTaskItem) => ({
    status: item.status,
    completedAt: item.status === TaskItemStatus.COMPLETED ? item.completedAt || new Date() : null,
    completedById: item.status === TaskItemStatus.COMPLETED ? item.completedById || user.id : null
  })

  const canUpdateAnyTasks = !!user.updateAnyTasks
  const data: Prisma.TaskUpdateInput = {
    ...(canUpdateAnyTasks && input.name !== undefined
      ? { name: input.name.trim() || existing.name }
      : {}),
    ...(canUpdateAnyTasks && input.dueAt !== undefined ? { dueAt: input.dueAt } : {}),
    ...(input.status ? { status: input.status } : {}),
    ...(input.status && input.status !== existing.status && canUpdateAnyTasks
      ? { reviewedAt: new Date(), reviewerId: user.id }
      : {}),
    ...(input.status && input.status !== existing.status && !canUpdateAnyTasks
      ? { submittedAt: new Date(), submitterId: user.id }
      : {}),
    ...(canUpdateAnyTasks && input.priority ? { priority: input.priority } : {}),
    ...(canUpdateAnyTasks && input.description ? { description: input.description } : {}),
    ...(canUpdateAnyTasks && input.items?.length
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
                ...getItemUpdateCommon(item)
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
    ...(!canUpdateAnyTasks && input.items?.length
      ? {
          items: {
            update: input.items.map(item => ({
              where: {
                id: item.id,
                taskId: id
              },
              data: getItemUpdateCommon(item)
            }))
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
  console.log('update', data, input)
  return prisma.task.update({
    where,
    data,
    include: TaskInclude
  })
})
