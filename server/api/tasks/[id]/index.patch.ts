import type { Prisma } from '~~/prisma/client/client'

import { TaskItemStatus, TaskPriority, TaskStatus } from '~~/prisma/client/enums'
import { z } from 'zod'

const zItems = z.object({
  id: z.number(),
  name: z.string().default(''),
  status: z.enum(TaskItemStatus).default(TaskItemStatus.TODO),
  completedAt: z.coerce.date().nullish(),
  completedById: z.number().nullish()
})

const zTaskUser = z.object({
  userId: z.number()
})

const zTaskTeam = z.object({
  teamId: z.number()
})

const zTaskPatch = z.object({
  name: zName('Task name is required!'),
  description: z.string().nullable().optional(),
  status: z.enum(TaskStatus).optional(),
  priority: z.enum(TaskPriority).optional(),
  dueAt: z.coerce.date().nullable().optional(),
  items: z.array(zItems).default([]),
  users: z.array(zTaskUser).default([]),
  teams: z.array(zTaskTeam).default([])
})

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

  const existing = await prisma.task.findFirst({ where })
  if (!existing) throw err.notFound()

  const input = await validate(await readBody(event), zTaskPatch)
  const status = input.status ?? existing.status

  if (!user.can?.updateAnyTasks) {
    const statuses: TaskStatus[] = [TaskStatus.IN_PROGRESS, TaskStatus.IN_REVIEW]
    if (!statuses.includes(status)) {
      throw err.unprocessable({
        status: {
          errors: [`You are not allowed to update the status to ${status}`]
        }
      })
    }
  }

  return prisma.task.update({
    where,
    data: {
      name: user?.can?.updateAnyTasks ? input.name.trim() || existing.name : existing.name,
      dueAt: user?.can?.updateAnyTasks ? input.dueAt : existing.dueAt,
      status,
      priority: user?.can?.updateAnyTasks ? input.priority : existing.priority,
      description: user?.can?.updateAnyTasks ? input.description : existing.description,
      reviewerId: user?.can?.updateAnyTasks
        ? status !== existing.status && status === TaskStatus.COMPLETED
          ? user.id
          : existing.reviewerId
        : existing.reviewerId,
      items: {
        deleteMany: user?.can?.updateAnyTasks
          ? {
              id: {
                notIn: input.items.map(item => item.id)
              }
            }
          : undefined,
        upsert: input.items.map((item, sortOrder) => {
          const data = {
            sortOrder,
            name: item.name,
            status: item.status,
            completedAt: user?.can?.updateAnyTasks
              ? item.status === TaskItemStatus.COMPLETED
                ? item.completedAt || new Date()
                : null
              : null,
            completedById: user?.can?.updateAnyTasks
              ? item.status === TaskItemStatus.COMPLETED
                ? item.completedById || user.id
                : null
              : null
          }
          return {
            where: {
              id: item.id,
              taskId: id
            },
            update: data,
            create: data
          }
        })
      },
      users: {
        deleteMany: user?.can?.updateAnyTasks
          ? {
              userId: {
                notIn: input.users.map(v => v.userId)
              }
            }
          : undefined,
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
      },
      teams: {
        deleteMany: user?.can?.updateAnyTasks
          ? {
              teamId: {
                notIn: input.teams.map(v => v.teamId)
              }
            }
          : undefined,
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
    },
    include: TaskInclude
  })
})
