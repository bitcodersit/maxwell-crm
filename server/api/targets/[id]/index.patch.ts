import type { Prisma } from '~~/prisma/client/client'
import type { TZTaskItem } from '~~/server/utils/tasks'
import { TaskItemStatus, TaskKind, TaskStatus, TargetFrequency } from '~~/prisma/client/enums'
import { advanceRecurrenceWindow } from '~~/server/utils/targets'

export default defineEventHandler(async event => {
  const user = await getCurrentUser(event)

  if (!user.updateAnyTargets && !user.updateOwnTargets) {
    throw err.denied()
  }

  const id = Number(getRouterParam(event, 'id'))
  if (!Number.isInteger(id) || id < 1) {
    throw err.notFound()
  }

  const where = {
    id,
    deletedAt: null,
    kind: TaskKind.TARGET,
    parentId: { not: null },
    ...(!user.updateAnyTargets ? getTaskOwnScope(user.id) : {})
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
      submitterId: true,
      parentId: true
    }
  })
  if (!existing) throw err.notFound()

  const input = await validate(await readBody(event), zTargetPatch)

  if (!user.updateAnyTargets && input.status && input.status !== existing.status) {
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

  const canUpdateAny = !!user.updateAnyTargets
  const data: Prisma.TaskUpdateInput = {
    ...(canUpdateAny && input.name !== undefined
      ? { name: input.name.trim() || existing.name }
      : {}),
    ...(canUpdateAny && input.dueAt !== undefined ? { dueAt: input.dueAt } : {}),
    ...(input.status ? { status: input.status } : {}),
    ...(input.status && input.status !== existing.status && canUpdateAny
      ? { reviewedAt: new Date(), reviewerId: user.id }
      : {}),
    ...(input.status && input.status !== existing.status && !canUpdateAny
      ? { submittedAt: new Date(), submitterId: user.id }
      : {}),
    ...(canUpdateAny && input.priority ? { priority: input.priority } : {}),
    ...(canUpdateAny && input.description ? { description: input.description } : {}),
    ...(canUpdateAny && input.items?.length
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
    ...(!canUpdateAny && input.items?.length
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
    ...(canUpdateAny && input.users !== undefined
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
    ...(canUpdateAny && input.teams !== undefined
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

  const updated = await prisma.task.update({
    where: { id },
    data,
    include: TargetInclude
  })

  const hasRecurrencePatch =
    canUpdateAny &&
    existing.parentId &&
    (input.frequency != null ||
      input.intervalDays !== undefined ||
      input.rangeStart != null ||
      input.rangeEnd != null ||
      input.endsAt !== undefined)

  if (hasRecurrencePatch && existing.parentId) {
    const recurrence = await prisma.taskRecurrence.findUnique({
      where: { taskId: existing.parentId }
    })
    if (recurrence) {
      const frequency = input.frequency ?? recurrence.frequency
      const intervalDays =
        frequency === TargetFrequency.CUSTOM
          ? (input.intervalDays ?? recurrence.intervalDays)
          : null
      const rangeStart = input.rangeStart ?? recurrence.rangeStart
      const rangeEnd = input.rangeEnd ?? recurrence.rangeEnd

      // If the caller provided a new current window, advance it to become nextRunAt
      let nextRangeStart = rangeStart
      let nextRangeEnd = rangeEnd
      let nextRunAt = recurrence.nextRunAt
      if (input.rangeStart != null || input.rangeEnd != null || input.frequency != null) {
        const advanced = advanceRecurrenceWindow({
          frequency,
          intervalDays,
          rangeStart,
          rangeEnd
        })
        nextRangeStart = advanced.rangeStart
        nextRangeEnd = advanced.rangeEnd
        nextRunAt = advanced.rangeStart
      }

      await prisma.taskRecurrence.update({
        where: { id: recurrence.id },
        data: {
          frequency,
          intervalDays,
          rangeStart: nextRangeStart,
          rangeEnd: nextRangeEnd,
          endsAt: input.endsAt === undefined ? recurrence.endsAt : input.endsAt,
          nextRunAt
        }
      })
    }
  }

  return prisma.task.findFirstOrThrow({
    where: { id: updated.id },
    include: TargetInclude
  })
})
