import { TaskItemStatus, TaskKind, TaskStatus } from '~~/prisma/client/enums'
import { advanceRecurrenceWindow, createTargetOccurrence } from '~~/server/utils/targets'

export default defineEventHandler(async event => {
  const user = await getCurrentUser(event)
  if (!user.createAnyTargets) {
    throw err.denied()
  }

  const body = await readBody(event)
  const input = await validate(body, zTargetPost)

  const next = advanceRecurrenceWindow({
    frequency: input.frequency,
    intervalDays: input.intervalDays,
    rangeStart: input.rangeStart,
    rangeEnd: input.rangeEnd
  })

  const template = await prisma.task.create({
    data: {
      name: input.name,
      description: input.description,
      kind: TaskKind.TARGET,
      status: TaskStatus.TODO,
      priority: input.priority,
      dueAt: input.rangeEnd,
      creatorId: user.id,
      reviewerId: user.id,
      reviewedAt: new Date(),
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
    input.rangeEnd,
    user.id
  )

  // Apply requested status to the first occurrence
  if (input.status && input.status !== TaskStatus.TODO) {
    await prisma.task.update({
      where: { id: occurrence.id },
      data: { status: input.status }
    })
  }

  return prisma.task.findFirstOrThrow({
    where: { id: occurrence.id },
    include: TargetInclude
  })
})
