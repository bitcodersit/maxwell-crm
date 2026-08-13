import type { Prisma } from '~~/prisma/client/client'
import { TaskKind } from '~~/prisma/client/enums'

export default defineEventHandler(async event => {
  const user = await getCurrentUser(event)
  const canDeleteAny = !!user.deleteAnyTargets
  const canDeleteOwn = !!user.deleteOwnTargets
  if (!canDeleteAny && !canDeleteOwn) {
    throw err.denied()
  }

  const idParam = getRouterParam(event, 'id')
  const ids = (idParam || '')
    .split(',')
    .map(v => Number(v.trim()))
    .filter(v => Number.isInteger(v) && v > 0)

  if (!ids.length) throw err.notFound()

  const now = new Date()
  if (canDeleteAny) {
    const data = await prisma.task.updateMany({
      where: {
        id: {
          in: ids
        },
        deletedAt: null,
        kind: TaskKind.TARGET,
        parentId: { not: null }
      },
      data: {
        deletedAt: now
      }
    })
    return {
      message: 'Target deleted successfully',
      data
    }
  }

  const success: number[] = []
  const skipped: { id: number; error: string }[] = []

  for (const id of [...new Set(ids)]) {
    const where: Prisma.TaskWhereInput = {
      id,
      deletedAt: null,
      kind: TaskKind.TARGET,
      parentId: { not: null },
      ...getTaskOwnScope(user.id)
    }
    const updated = await prisma.task.updateMany({
      where,
      data: {
        deletedAt: now
      }
    })
    if (updated.count > 0) {
      success.push(id)
    } else {
      skipped.push({
        id,
        error: 'target not found or no access'
      })
    }
  }

  return {
    message: 'Target delete completed',
    success,
    skipped
  }
})
