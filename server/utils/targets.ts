import { addDays, addMonths } from 'date-fns'
import { TargetFrequency, TaskItemStatus, TaskKind, TaskStatus } from '~~/prisma/client/enums'

export type TRecurrenceWindow = {
  frequency: TargetFrequency
  intervalDays?: number | null
  rangeStart: Date
  rangeEnd: Date
  endsAt?: Date | null
}

export const advanceRecurrenceWindow = (recurrence: TRecurrenceWindow) => {
  if (recurrence.frequency === TargetFrequency.MONTHLY) {
    return {
      rangeStart: addMonths(recurrence.rangeStart, 1),
      rangeEnd: addMonths(recurrence.rangeEnd, 1)
    }
  }

  const amount =
    recurrence.frequency === TargetFrequency.WEEKLY ? 7 : recurrence.intervalDays || 1

  return {
    rangeStart: addDays(recurrence.rangeStart, amount),
    rangeEnd: addDays(recurrence.rangeEnd, amount)
  }
}

export const createTargetOccurrence = async (
  template: {
    id: number
    name: string
    description: string | null
    priority: any
    creatorId: number | null
    items: { name: string; sortOrder: number }[]
    users: { userId: number }[]
    teams: { teamId: number }[]
  },
  rangeEnd: Date,
  actorId: number
) => {
  return prisma.task.create({
    data: {
      name: template.name,
      description: template.description,
      kind: TaskKind.TARGET,
      status: TaskStatus.TODO,
      priority: template.priority,
      dueAt: rangeEnd,
      creatorId: template.creatorId ?? actorId,
      reviewerId: actorId,
      reviewedAt: new Date(),
      parentId: template.id,
      items: {
        createMany: {
          data: template.items.map(item => ({
            name: item.name,
            sortOrder: item.sortOrder,
            status: TaskItemStatus.TODO
          }))
        }
      },
      users: {
        createMany: {
          data: template.users.map(u => ({ userId: u.userId }))
        }
      },
      teams: {
        createMany: {
          data: template.teams.map(t => ({ teamId: t.teamId }))
        }
      }
    }
  })
}

/** Generate due target occurrences for templates whose next window has started. */
export const ensureTargetOccurrences = async (actorId?: number) => {
  const now = new Date()
  const templates = await prisma.task.findMany({
    where: {
      kind: TaskKind.TARGET,
      parentId: null,
      deletedAt: null,
      recurrence: {
        deletedAt: null,
        OR: [{ nextRunAt: null }, { nextRunAt: { lte: now } }]
      }
    },
    include: {
      recurrence: true,
      items: {
        where: { deletedAt: null },
        orderBy: { sortOrder: 'asc' },
        select: { name: true, sortOrder: true }
      },
      users: { select: { userId: true } },
      teams: { select: { teamId: true } }
    },
    take: 100
  })

  for (const template of templates) {
    const recurrence = template.recurrence
    if (!recurrence) continue

    let rangeStart = recurrence.rangeStart
    let rangeEnd = recurrence.rangeEnd
    let nextRunAt = recurrence.nextRunAt ?? rangeStart
    let changed = false

    for (let i = 0; i < 52 && nextRunAt <= now; i++) {
      if (recurrence.endsAt && rangeStart > recurrence.endsAt) {
        nextRunAt = addDays(recurrence.endsAt, 1)
        changed = true
        break
      }

      const existing = await prisma.task.findFirst({
        where: {
          parentId: template.id,
          deletedAt: null,
          dueAt: rangeEnd
        },
        select: { id: true }
      })

      if (!existing) {
        await createTargetOccurrence(
          template,
          rangeEnd,
          actorId ?? template.creatorId ?? 0
        )
      }

      const advanced = advanceRecurrenceWindow({
        frequency: recurrence.frequency,
        intervalDays: recurrence.intervalDays,
        rangeStart,
        rangeEnd
      })
      rangeStart = advanced.rangeStart
      rangeEnd = advanced.rangeEnd
      nextRunAt = rangeStart
      changed = true

      if (recurrence.endsAt && rangeStart > recurrence.endsAt) {
        break
      }
    }

    if (changed) {
      await prisma.taskRecurrence.update({
        where: { id: recurrence.id },
        data: {
          rangeStart,
          rangeEnd,
          nextRunAt
        }
      })
    }
  }
}
