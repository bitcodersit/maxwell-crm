import type { Prisma } from '~~/prisma/client/client'
import { TargetStatus, TaskItemStatus, TaskKind, TaskStatus } from '~~/prisma/client/enums'
import { addDays, startOfDay } from 'date-fns'
import {
  advanceTargetWindow,
  getOpenTargetStatusForWindow,
  getTargetFillUp,
  isPastTargetWindow,
  isTargetSeriesEndStatus
} from '~~/shared/utils/targetWindows'

const occurrenceSnapshotInclude = {
  items: {
    where: { deletedAt: null },
    orderBy: { sortOrder: 'asc' as const },
    select: { name: true, sortOrder: true }
  },
  users: { where: { deletedAt: null }, select: { userId: true } },
  teams: { where: { deletedAt: null }, select: { teamId: true } },
  attachable: {
    select: {
      attachments: {
        where: { deletedAt: null },
        select: {
          name: true,
          path: true,
          type: true,
          size: true,
          mime: true,
          provider: true,
          uploaderId: true
        }
      }
    }
  }
} satisfies Prisma.TaskInclude

type TOccurrenceSnapshot = Prisma.TaskGetPayload<{ include: typeof occurrenceSnapshotInclude }>

export const getTargetStatusFromChecklist = (
  items: { status: TaskItemStatus }[] | null | undefined,
  current: TargetStatus | null | undefined,
  startsAt: Date | null | undefined,
  dueAt: Date | null | undefined,
  now = new Date()
): TargetStatus => {
  if (current === TargetStatus.SKIPPED) return TargetStatus.SKIPPED
  if (isTargetSeriesEndStatus(current)) return current as TargetStatus
  if (current === TargetStatus.PAUSED && (!dueAt || !isPastTargetWindow(dueAt, now))) {
    return TargetStatus.PAUSED
  }

  const fillUp = getTargetFillUp(items)
  if (fillUp.isFilledUp) return TargetStatus.ACHIEVED

  if (!startsAt || !dueAt) return current || TargetStatus.RUNNING
  if (isPastTargetWindow(dueAt, now)) return TargetStatus.MISSED
  return getOpenTargetStatusForWindow(startsAt, dueAt, now)
}

const syncOccurrenceStatus = async (
  occurrence: {
    id: number
    targetStatus: TargetStatus | null
    startsAt: Date | null
    dueAt: Date | null
    items: { status: TaskItemStatus }[]
  },
  now: Date
) => {
  const next = getTargetStatusFromChecklist(
    occurrence.items,
    occurrence.targetStatus,
    occurrence.startsAt,
    occurrence.dueAt,
    now
  )
  if (next !== occurrence.targetStatus) {
    await prisma.task.update({
      where: { id: occurrence.id },
      data: { targetStatus: next }
    })
  }
  return next
}

export const createTargetOccurrence = async (
  template: {
    id: number
    name: string
    description: string | null
    priority: TOccurrenceSnapshot['priority']
    creatorId: number | null
    items: { name: string; sortOrder: number }[]
    users: { userId: number }[]
    teams: { teamId: number }[]
    attachable?: TOccurrenceSnapshot['attachable']
  },
  window: { rangeStart: Date; rangeEnd: Date },
  actorId: number
) => {
  const targetStatus = getOpenTargetStatusForWindow(window.rangeStart, window.rangeEnd)
  const attachments = template.attachable?.attachments || []

  let attachableId: number | null = null
  if (attachments.length) {
    const attachable = await prisma.attachable.create({
      data: {
        attachments: {
          createMany: {
            data: attachments.map(attachment => ({
              name: attachment.name,
              path: attachment.path,
              type: attachment.type,
              size: attachment.size,
              mime: attachment.mime,
              provider: attachment.provider,
              uploaderId: attachment.uploaderId
            }))
          }
        }
      }
    })
    attachableId = attachable.id
  }

  return prisma.task.create({
    data: {
      name: template.name,
      description: template.description,
      kind: TaskKind.TARGET,
      status: TaskStatus.TODO,
      targetStatus,
      priority: template.priority,
      startsAt: window.rangeStart,
      dueAt: window.rangeEnd,
      creatorId: template.creatorId ?? actorId,
      parentId: template.id,
      attachableId,
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

const loadSnapshot = async (id: number) => {
  return prisma.task.findFirst({
    where: { id, deletedAt: null },
    include: occurrenceSnapshotInclude
  })
}

const findExistingWindow = async (parentId: number, rangeStart: Date, rangeEnd: Date) => {
  const start = startOfDay(rangeStart)
  const end = startOfDay(rangeEnd)
  return prisma.task.findFirst({
    where: {
      parentId,
      kind: TaskKind.TARGET,
      startsAt: { lte: end },
      dueAt: { gte: start }
    },
    select: { id: true, deletedAt: true }
  })
}

export const stopTargetSeries = async (parentId: number, endsAt = new Date()) => {
  const recurrence = await prisma.taskRecurrence.findUnique({
    where: { taskId: parentId }
  })
  if (!recurrence) return
  await prisma.taskRecurrence.update({
    where: { id: recurrence.id },
    data: {
      endsAt,
      nextRunAt: startOfDay(addDays(endsAt, 1))
    }
  })
}

let ensuring: Promise<void> | null = null

/** Generate due target occurrences for templates whose next window has started. */
export const ensureTargetOccurrences = async (actorId?: number) => {
  if (ensuring) return ensuring
  ensuring = generateTargetOccurrences(actorId).finally(() => {
    ensuring = null
  })
  return ensuring
}

const generateTargetOccurrences = async (actorId?: number) => {
  const now = new Date()
  const templates = await prisma.task.findMany({
    where: {
      kind: TaskKind.TARGET,
      parentId: null,
      deletedAt: null,
      recurrence: {
        is: { deletedAt: null }
      }
    },
    include: {
      recurrence: true,
      ...occurrenceSnapshotInclude
    },
    take: 100
  })

  for (const template of templates) {
    const recurrence = template.recurrence
    if (!recurrence) continue

    const children = await prisma.task.findMany({
      where: {
        parentId: template.id,
        kind: TaskKind.TARGET,
        deletedAt: null
      },
      include: {
        items: {
          where: { deletedAt: null },
          select: { status: true }
        }
      },
      orderBy: { dueAt: 'desc' }
    })

    let seriesEnded = false
    for (const child of children) {
      const synced = await syncOccurrenceStatus(child, now)
      if (isTargetSeriesEndStatus(synced) || isTargetSeriesEndStatus(child.targetStatus)) {
        seriesEnded = true
      }
    }

    if (seriesEnded || (recurrence.endsAt && startOfDay(recurrence.endsAt) < startOfDay(now))) {
      continue
    }

    const today = startOfDay(now)
    const latest = children[0]
    let haveOpenOrUpcoming = children.some(
      child => child.dueAt && startOfDay(child.dueAt) >= today
    )

    let snapshot: TOccurrenceSnapshot | null =
      (latest ? await loadSnapshot(latest.id) : null) || template
    let rangeStart = recurrence.rangeStart
    let rangeEnd = recurrence.rangeEnd
    if (latest?.startsAt && latest?.dueAt) {
      const next = advanceTargetWindow({
        frequency: recurrence.frequency,
        intervalDays: recurrence.intervalDays,
        rangeStart: latest.startsAt,
        rangeEnd: latest.dueAt
      })
      rangeStart = next.rangeStart
      rangeEnd = next.rangeEnd
    }
    let nextRunAt = rangeStart
    let changed = false

    const spawnWindow = async () => {
      const existing = await findExistingWindow(template.id, rangeStart, rangeEnd)
      if (!existing) {
        const source = snapshot || template
        const created = await createTargetOccurrence(
          {
            id: template.id,
            name: source.name,
            description: source.description,
            priority: source.priority,
            creatorId: source.creatorId ?? template.creatorId,
            items: source.items,
            users: source.users,
            teams: source.teams,
            attachable: source.attachable
          },
          { rangeStart, rangeEnd },
          actorId ?? template.creatorId ?? 0
        )
        snapshot = (await loadSnapshot(created.id)) || snapshot
      }
    }

    for (let i = 0; i < 52; i++) {
      if (recurrence.endsAt && startOfDay(rangeStart) > startOfDay(recurrence.endsAt)) {
        nextRunAt = addDays(recurrence.endsAt, 1)
        changed = true
        break
      }

      const windowStarted = startOfDay(rangeStart) <= today
      if (!windowStarted) {
        if (haveOpenOrUpcoming) break
        await spawnWindow()
        const advanced = advanceTargetWindow({
          frequency: recurrence.frequency,
          intervalDays: recurrence.intervalDays,
          rangeStart,
          rangeEnd
        })
        rangeStart = advanced.rangeStart
        rangeEnd = advanced.rangeEnd
        nextRunAt = rangeStart
        changed = true
        break
      }

      await spawnWindow()
      if (startOfDay(rangeEnd) >= today) {
        haveOpenOrUpcoming = true
      }

      const advanced = advanceTargetWindow({
        frequency: recurrence.frequency,
        intervalDays: recurrence.intervalDays,
        rangeStart,
        rangeEnd
      })
      rangeStart = advanced.rangeStart
      rangeEnd = advanced.rangeEnd
      nextRunAt = rangeStart
      changed = true

      if (recurrence.endsAt && startOfDay(rangeStart) > startOfDay(recurrence.endsAt)) {
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

export const canReadTargets = (user: {
  readAnyTargets?: boolean | null
  readOwnTargets?: boolean | null
}) => !!(user.readAnyTargets || user.readOwnTargets)

export const isPastTargetCycle = (target: {
  dueAt?: Date | string | null
  targetStatus?: TargetStatus | null
}) => {
  if (isTargetSeriesEndStatus(target.targetStatus)) return true
  if (target.targetStatus === TargetStatus.MISSED) return true
  return isPastTargetWindow(target.dueAt)
}

export const canEditTargetCycle = (
  user: { updateAnyTargets?: boolean | null; updateOwnTargets?: boolean | null },
  target: { dueAt?: Date | string | null; targetStatus?: TargetStatus | null }
) => {
  if (user.updateAnyTargets) return true
  if (!user.updateOwnTargets) return false
  return !isPastTargetCycle(target)
}
