import type { Prisma } from '~~/prisma/client/client'
import type { TZTaskItem } from '~~/server/utils/tasks'
import { TaskItemStatus, TaskKind, TargetFrequency, TargetStatus } from '~~/prisma/client/enums'
import { startOfDay } from 'date-fns'
import {
  canEditTargetCycle,
  getTargetStatusFromChecklist,
  isPastTargetCycle,
  stopTargetSeries
} from '~~/server/utils/targets'
import { advanceTargetWindow, isTargetSeriesEndStatus } from '~~/shared/utils/targetWindows'

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
    include: {
      items: {
        where: { deletedAt: null },
        select: { id: true, status: true }
      }
    }
  })
  if (!existing) throw err.notFound()

  const input = await validate(await readBody(event), zTargetPatch)
  const canUpdateAny = !!user.updateAnyTargets
  const past = isPastTargetCycle(existing)

  if (past && !canUpdateAny) {
    throw err.denied()
  }

  if (!canEditTargetCycle(user, existing) && !canUpdateAny) {
    throw err.denied()
  }

  const seriesEndRequested = input.targetStatus && isTargetSeriesEndStatus(input.targetStatus)
  if (seriesEndRequested && !canUpdateAny) {
    throw err.unprocessable({
      targetStatus: {
        errors: ['You are not allowed to stop or cancel this target']
      }
    })
  }

  if (!canUpdateAny && input.targetStatus && input.targetStatus !== existing.targetStatus) {
    const allowed: TargetStatus[] = [
      TargetStatus.RUNNING,
      TargetStatus.PAUSED,
      TargetStatus.SKIPPED
    ]
    if (!allowed.includes(input.targetStatus)) {
      throw err.unprocessable({
        targetStatus: {
          errors: [`You are not allowed to update the status to ${input.targetStatus}`]
        }
      })
    }
  }

  const getItemUpdateCommon = (item: TZTaskItem) => ({
    status: item.status,
    completedAt: item.status === TaskItemStatus.COMPLETED ? item.completedAt || new Date() : null,
    completedById: item.status === TaskItemStatus.COMPLETED ? item.completedById || user.id : null
  })

  const itemsForStatus = input.items?.length
    ? input.items.map(item => ({ status: item.status }))
    : existing.items

  let nextStatus = existing.targetStatus
  if (input.targetStatus) {
    nextStatus = input.targetStatus
  } else if (input.items?.length && existing.targetStatus !== TargetStatus.PAUSED) {
    nextStatus = getTargetStatusFromChecklist(
      itemsForStatus,
      existing.targetStatus,
      input.startsAt ?? existing.startsAt,
      input.dueAt ?? existing.dueAt
    )
  }

  const data: Prisma.TaskUpdateInput = {
    ...(canUpdateAny && input.name !== undefined
      ? { name: input.name.trim() || existing.name }
      : {}),
    ...(canUpdateAny && input.dueAt !== undefined ? { dueAt: input.dueAt } : {}),
    ...(canUpdateAny && input.startsAt !== undefined ? { startsAt: input.startsAt } : {}),
    ...(nextStatus ? { targetStatus: nextStatus } : {}),
    ...(canUpdateAny && input.priority ? { priority: input.priority } : {}),
    ...(canUpdateAny && input.description !== undefined ? { description: input.description } : {}),
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

  await prisma.task.update({
    where: { id },
    data
  })

  if (nextStatus && isTargetSeriesEndStatus(nextStatus) && existing.parentId) {
    await stopTargetSeries(existing.parentId)
  }

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
      const rangeStart = startOfDay(input.rangeStart ?? recurrence.rangeStart)
      const rangeEnd = startOfDay(input.rangeEnd ?? recurrence.rangeEnd)

      let nextRangeStart = rangeStart
      let nextRangeEnd = rangeEnd
      let nextRunAt = recurrence.nextRunAt
      if (input.rangeStart != null || input.rangeEnd != null || input.frequency != null) {
        const advanced = advanceTargetWindow({
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
    where: { id },
    include: TargetInclude
  })
})
