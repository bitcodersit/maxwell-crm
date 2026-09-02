import type { Prisma } from '~~/prisma/client/client'
import { TaskKind } from '~~/prisma/client/enums'
import { canReadTargets } from '~~/server/utils/targets'
import { getTargetFillUp } from '~~/shared/utils/targetWindows'

export const getTargetHistory = async (event: any, occurrenceId: number) => {
  const user = await getCurrentUser(event)
  if (!canReadTargets(user)) {
    throw err.denied()
  }

  const occurrence = await prisma.task.findFirst({
    where: {
      id: occurrenceId,
      deletedAt: null,
      kind: TaskKind.TARGET,
      parentId: { not: null },
      ...(user.readAnyTargets ? {} : getTaskOwnScope(user.id))
    },
    select: {
      id: true,
      parentId: true
    }
  })
  if (!occurrence?.parentId) throw err.notFound()

  const where: Prisma.TaskWhereInput = {
    parentId: occurrence.parentId,
    deletedAt: null,
    kind: TaskKind.TARGET,
    id: { not: occurrenceId },
    ...(user.readAnyTargets ? {} : getTaskOwnScope(user.id))
  }

  const rows = await prisma.task.findMany({
    where,
    orderBy: [{ dueAt: 'desc' }, { createdAt: 'desc' }],
    take: 50,
    include: {
      items: {
        where: { deletedAt: null },
        select: {
          id: true,
          name: true,
          status: true,
          completedAt: true
        }
      }
    }
  })

  return rows.map(row => {
    const fillUp = getTargetFillUp(row.items)
    return {
      id: row.id,
      name: row.name,
      status: row.targetStatus,
      targetStatus: row.targetStatus,
      startsAt: row.startsAt,
      dueAt: row.dueAt,
      createdAt: row.createdAt,
      ...fillUp,
      items: row.items
    }
  })
}
