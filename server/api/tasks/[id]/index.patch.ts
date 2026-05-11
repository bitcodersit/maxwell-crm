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

const zTaskPatch = z.object({
  name: zName('Task name is required!'),
  description: z.string().nullable().optional(),
  status: z.enum(TaskStatus).optional(),
  priority: z.enum(TaskPriority).optional(),
  dueAt: z.coerce.date().nullable().optional(),
  // reviewerId: z.number().int().positive().nullable().optional(),
  // userIds: z.array(z.number().int().positive()).optional(),
  // teamIds: z.array(z.number().int().positive()).optional(),
  // attachmentIds: z.array(z.number().int().positive()).optional(),
  // addAttachmentIds: z.array(z.number().int().positive()).optional(),
  // removeAttachmentIds: z.array(z.number().int().positive()).optional(),
  items: z.array(zItems).default([])
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

const hasOps = (input: z.infer<typeof zTaskPatch>) => {
  return Object.values(input).some(v => typeof v !== 'undefined')
}

const getItemStatus = (item: {
  status?: TaskItemStatus
  checked?: boolean
  completed?: boolean
}) => {
  if (item.status) return item.status
  if (item.checked === true || item.completed === true) return TaskItemStatus.COMPLETED
  if (item.checked === false || item.completed === false) return TaskItemStatus.TODO
  return undefined
}

export default defineEventHandler(async event => {
  const { user } = await requireUserSession(event)

  if (!can(user, ['update-any-tasks', 'update-own-tasks'])) {
    throw err.denied()
  }

  const id = Number(getRouterParam(event, 'id'))
  if (!Number.isInteger(id) || id < 1) {
    throw err.notFound()
  }

  // if (!hasOps(input)) {
  //   throw err.unprocessable({
  //     body: {
  //       errors: ['No fields provided for update']
  //     }
  //   })
  // }

  const where: Prisma.TaskWhereInput = {
    id,
    deletedAt: null,
    ...(can(user, ['update-any-tasks']) ? {} : getOwnScope(user.id))
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

  await prisma.task.update({
    where: {
      id
    },
    data: {
      name: input.name.trim() || existing.name,
      dueAt: input.dueAt,
      status,
      priority: input.priority,
      description: input.description,
      reviewerId:
        status !== existing.status && status === TaskStatus.COMPLETED
          ? user.id
          : existing.reviewerId,
      items: {
        deleteMany: {
          id: {
            notIn: input.items.map(item => item.id)
          }
        },
        upsert: input.items.map((item, sortOrder) => {
          const data = {
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
            update: data,
            create: data
          }
        })
      }
    }
  })

  // const now = new Date()
  // await prisma.$transaction(async tx => {
  //   const data: Prisma.TaskUpdateInput = {}

  // if (typeof input.name !== 'undefined') data.name = input.name
  // if (typeof input.description !== 'undefined') data.description = input.description
  // if (typeof input.status !== 'undefined') {
  //   data.status = input.status
  //   data.completedAt = input.status === TaskStatus.COMPLETED ? now : null
  // }
  // if (typeof input.priority !== 'undefined') data.priority = input.priority
  // if (typeof input.dueAt !== 'undefined') data.dueAt = input.dueAt
  // if (typeof input.reviewerId !== 'undefined') {
  //   data.reviewer = input.reviewerId
  //     ? {
  //         connect: {
  //           id: input.reviewerId
  //         }
  //       }
  //     : {
  //         disconnect: true
  //       }
  // }

  // if (typeof input.userIds !== 'undefined') {
  //   data.users = {
  //     deleteMany: {
  //       userId: {
  //         notIn: input.userIds
  //       }
  //     },
  //     ...(input.userIds.length
  //       ? {
  //           createMany: {
  //             skipDuplicates: true,
  //             data: input.userIds.map(userId => ({ userId }))
  //           }
  //         }
  //       : {})
  //   }
  // }

  // if (typeof input.teamIds !== 'undefined') {
  //   data.teams = {
  //     deleteMany: {
  //       teamId: {
  //         notIn: input.teamIds
  //       }
  //     },
  //     ...(input.teamIds.length
  //       ? {
  //           createMany: {
  //             skipDuplicates: true,
  //             data: input.teamIds.map(teamId => ({ teamId }))
  //           }
  //         }
  //       : {})
  //   }
  // }

  // if (typeof input.attachmentIds !== 'undefined') {
  //   data.attachables = {
  //     deleteMany: {
  //       attachmentId: {
  //         notIn: input.attachmentIds
  //       }
  //     },
  //     ...(input.attachmentIds.length
  //       ? {
  //           createMany: {
  //             skipDuplicates: true,
  //             data: input.attachmentIds.map(attachmentId => ({ attachmentId }))
  //           }
  //         }
  //       : {})
  //   }
  // }

  // if (Object.keys(data).length > 0) {
  //   await tx.task.update({
  //     where: {
  //       id: taskId
  //     },
  //     data
  //   })
  // }

  // if (input.addAttachmentIds?.length) {
  //   await tx.attachable.createMany({
  //     skipDuplicates: true,
  //     data: input.addAttachmentIds.map(attachmentId => ({
  //       taskId,
  //       attachmentId
  //     }))
  //   })
  // }

  // if (input.removeAttachmentIds?.length) {
  //   await tx.attachable.deleteMany({
  //     where: {
  //       taskId,
  //       attachmentId: {
  //         in: input.removeAttachmentIds
  //       }
  //     }
  //   })
  // }

  // if (input.addItems?.length) {
  //   const todoNewCount = input.addItems.filter(item => {
  //     const st = item.checked || item.completed ? TaskItemStatus.COMPLETED : TaskItemStatus.TODO
  //     return st === TaskItemStatus.TODO
  //   }).length

  //   if (todoNewCount > 0) {
  //     await tx.taskItem.updateMany({
  //       where: {
  //         taskId,
  //         deletedAt: null,
  //         status: TaskItemStatus.TODO
  //       },
  //       data: {
  //         sortOrder: {
  //           increment: todoNewCount
  //         }
  //       }
  //     })
  //   }

  //   const maxCompletedAgg = await tx.taskItem.aggregate({
  //     where: {
  //       taskId,
  //       deletedAt: null,
  //       status: TaskItemStatus.COMPLETED
  //     },
  //     _max: {
  //       sortOrder: true
  //     }
  //   })
  //   let nextCompletedSort = (maxCompletedAgg._max.sortOrder ?? -1) + 1
  //   let nextTodoSort = 0

  //   const rowsToCreate: Array<{
  //     taskId: number
  //     name: string
  //     sortOrder: number
  //     status: TaskItemStatus
  //     completedAt: Date | null
  //     completedById: number | null
  //   }> = []
  //   for (const raw of input.addItems) {
  //     const status = raw.checked || raw.completed ? TaskItemStatus.COMPLETED : TaskItemStatus.TODO
  //     const sortOrder = status === TaskItemStatus.TODO ? nextTodoSort++ : nextCompletedSort++
  //     rowsToCreate.push({
  //       taskId,
  //       name: raw.name,
  //       sortOrder,
  //       status,
  //       completedAt: status === TaskItemStatus.COMPLETED ? now : null,
  //       completedById: status === TaskItemStatus.COMPLETED ? user.id : null
  //     })
  //   }

  //   await tx.taskItem.createMany({
  //     data: rowsToCreate
  //   })
  // }

  // if (input.updateItems?.length) {
  //   for (const item of input.updateItems) {
  //     const existing = await tx.taskItem.findFirst({
  //       where: {
  //         id: item.id,
  //         taskId,
  //         deletedAt: null
  //       },
  //       select: {
  //         id: true,
  //         status: true,
  //         sortOrder: true
  //       }
  //     })
  //     if (!existing) continue

  //     const parsedStatus = getItemStatus(item)
  //     const nextStatus = typeof parsedStatus !== 'undefined' ? parsedStatus : existing.status
  //     const statusTransition =
  //       typeof parsedStatus !== 'undefined' && parsedStatus !== existing.status

  //     const patch: Prisma.TaskItemUncheckedUpdateManyInput = {}

  //     if (typeof item.name !== 'undefined') patch.name = item.name

  //     if (statusTransition) {
  //       patch.status = nextStatus
  //       patch.completedAt = nextStatus === TaskItemStatus.COMPLETED ? now : null
  //       patch.completedById = nextStatus === TaskItemStatus.COMPLETED ? user.id : null

  //       if (nextStatus === TaskItemStatus.COMPLETED && existing.status === TaskItemStatus.TODO) {
  //         const maxCompletedSort = await tx.taskItem.aggregate({
  //           where: {
  //             taskId,
  //             deletedAt: null,
  //             status: TaskItemStatus.COMPLETED,
  //             id: {
  //               not: item.id
  //             }
  //           },
  //           _max: {
  //             sortOrder: true
  //           }
  //         })
  //         patch.sortOrder = (maxCompletedSort._max.sortOrder ?? -1) + 1
  //       } else if (
  //         nextStatus === TaskItemStatus.TODO &&
  //         existing.status === TaskItemStatus.COMPLETED
  //       ) {
  //         await tx.taskItem.updateMany({
  //           where: {
  //             taskId,
  //             deletedAt: null,
  //             status: TaskItemStatus.TODO,
  //             id: {
  //               not: item.id
  //             }
  //           },
  //           data: {
  //             sortOrder: {
  //               increment: 1
  //             }
  //           }
  //         })
  //         patch.sortOrder = 0
  //       }
  //     } else if (typeof item.sortOrder !== 'undefined') {
  //       patch.sortOrder = item.sortOrder
  //     }

  //     await tx.taskItem.updateMany({
  //       where: {
  //         id: item.id,
  //         taskId,
  //         deletedAt: null
  //       },
  //       data: patch
  //     })
  //   }
  // }

  // if (input.deleteItemIds?.length) {
  //   await tx.taskItem.updateMany({
  //     where: {
  //       taskId,
  //       id: {
  //         in: input.deleteItemIds
  //       },
  //       deletedAt: null
  //     },
  //     data: {
  //       deletedAt: now
  //     }
  //   })
  // }
  // })

  const updated = await prisma.task.findUnique({
    where: { id },
    include: TaskInclude
  })

  if (!updated || updated.deletedAt) throw err.notFound()
  return updated
})
