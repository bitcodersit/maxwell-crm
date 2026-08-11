import type { Prisma } from '~~/prisma/client/client'
import { TaskItemStatus, TaskKind } from '~~/prisma/client/enums'

export type TTargetCycleFillUp = {
  totalItems: number
  completedItems: number
  fillUpPercent: number
  isFilledUp: boolean
}

export const getTargetFillUp = (
  items: { status: TaskItemStatus }[] | null | undefined
): TTargetCycleFillUp => {
  const list = items || []
  const totalItems = list.length
  const completedItems = list.filter(item => item.status === TaskItemStatus.COMPLETED).length
  const fillUpPercent = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0
  return {
    totalItems,
    completedItems,
    fillUpPercent,
    isFilledUp: totalItems > 0 && completedItems === totalItems
  }
}

export const getTargetHistory = async (event: any, occurrenceId: number) => {
  const user = await getCurrentUser(event)
  if (!user.readAnyTargets || !user.readOwnTargets) {
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
      status: row.status,
      dueAt: row.dueAt,
      createdAt: row.createdAt,
      reviewedAt: row.reviewedAt,
      submittedAt: row.submittedAt,
      ...fillUp,
      items: row.items
    }
  })
}
