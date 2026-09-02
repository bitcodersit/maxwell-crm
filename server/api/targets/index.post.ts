import { TaskItemStatus, TaskKind, TaskStatus } from '~~/prisma/client/enums'
import { startOfDay } from 'date-fns'
import { createTargetOccurrence } from '~~/server/utils/targets'
import { advanceTargetWindow, getOpenTargetStatusForWindow } from '~~/shared/utils/targetWindows'

export default defineEventHandler(async event => {
  const user = await getCurrentUser(event)
  if (!user.createAnyTargets) {
    throw err.denied()
  }

  const body = await readBody(event)
  const input = await validate(body, zTargetPost)
  const rangeStart = startOfDay(input.rangeStart)
  const rangeEnd = startOfDay(input.rangeEnd)

  const next = advanceTargetWindow({
    frequency: input.frequency,
    intervalDays: input.intervalDays,
    rangeStart,
    rangeEnd
  })

  const firstStatus = getOpenTargetStatusForWindow(rangeStart, rangeEnd)

  const template = await prisma.task.create({
    data: {
      name: input.name,
      description: input.description,
      kind: TaskKind.TARGET,
      status: TaskStatus.TODO,
      targetStatus: firstStatus,
      priority: input.priority,
      startsAt: rangeStart,
      dueAt: rangeEnd,
      creatorId: user.id,
      items: {
        createMany: {
          data: (input.items || []).map((item, sortOrder) => ({
            sortOrder,
            name: item.name,
            status: TaskItemStatus.TODO
          }))
        }
      },
      recurrence: {
        create: {
          frequency: input.frequency,
          intervalDays: input.frequency === 'CUSTOM' ? input.intervalDays : null,
          rangeStart: next.rangeStart,
          rangeEnd: next.rangeEnd,
          endsAt: input.endsAt,
          nextRunAt: next.rangeStart
        }
      }
    },
    include: {
      items: {
        where: { deletedAt: null },
        orderBy: { sortOrder: 'asc' },
        select: { name: true, sortOrder: true }
      },
      users: { select: { userId: true } },
      teams: { select: { teamId: true } }
    }
  })

  const occurrence = await createTargetOccurrence(
    {
      id: template.id,
      name: template.name,
      description: template.description,
      priority: template.priority,
      creatorId: template.creatorId,
      items: template.items,
      users: template.users,
      teams: template.teams
    },
    { rangeStart, rangeEnd },
    user.id
  )

  return prisma.task.findFirstOrThrow({
    where: { id: occurrence.id },
    include: TargetInclude
  })
})
