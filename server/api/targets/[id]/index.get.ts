import type { Prisma } from '~~/prisma/client/client'
import { TaskKind } from '~~/prisma/client/enums'

export default defineEventHandler(async event => {
  const user = await getCurrentUser(event)
  if (!user.readAnyTargets || !user.readOwnTargets) {
    throw err.denied()
  }

  await ensureTargetOccurrences(user.id)

  const id = Number(getRouterParam(event, 'id'))
  if (!Number.isInteger(id) || id < 1) {
    throw err.notFound()
  }

  const where: Prisma.TaskWhereInput = {
    id,
    deletedAt: null,
    kind: TaskKind.TARGET,
    parentId: { not: null },
    ...(user.readAnyTargets ? {} : getTaskOwnScope(user.id))
  }

  const target = await prisma.task.findFirst({
    where,
    include: TargetInclude
  })

  if (!target) throw err.notFound()
  return target
})
