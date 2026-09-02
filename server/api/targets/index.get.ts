import type { H3Event } from 'h3'
import { startOfDay } from 'date-fns'
import { TargetStatus } from '~~/prisma/client/enums'
import { canReadTargets } from '~~/server/utils/targets'

const getTargetScopedWhere = (user: TUser, where: Prisma.TaskWhereInput) => {
  if (user.readAnyTargets) return where
  return {
    AND: [where, getTaskOwnScope(user.id)]
  } satisfies Prisma.TaskWhereInput
}

const toStatusList = (value: unknown): TargetStatus[] => {
  const values = Array.isArray(value)
    ? value
    : (value || '').toString().trim().split(',').filter(Boolean)
  return values.filter((status): status is TargetStatus =>
    Object.values(TargetStatus).includes(status as TargetStatus)
  )
}

export const getTargets = async (event: H3Event, query = getQuery(event)) => {
  const user = await getCurrentUser(event)
  if (!canReadTargets(user)) {
    return {
      error: err.denied()
    }
  }

  await ensureTargetOccurrences(user.id)

  const requestedStatuses = toStatusList(query.targetStatus ?? query.status)
  const applyCurrentWindow =
    !requestedStatuses.length ||
    requestedStatuses.every(
      status => status === TargetStatus.RUNNING || status === TargetStatus.PAUSED
    )

  const today = startOfDay(new Date())
  const where = getWhere<Prisma.TaskWhereInput>(query, {
    deletedAt: null,
    ...targetOccurrenceWhere(),
    ...(applyCurrentWindow
      ? {
          startsAt: { lte: today },
          dueAt: { gte: today }
        }
      : {})
  })
    .id('id')
    .text('name')
    .text('description')
    .array('targetStatus')
    .array('status', values => ({
      targetStatus: { in: values as TargetStatus[] }
    }))
    .array('priority')
    .id('creatorId')
    .id('reviewerId')
    .id('submitterId')
    .date('startsAt')
    .date('dueAt')
    .date('createdAt')
    .date('updatedAt')
    .id('users', userId => ({
      users: {
        some: {
          userId
        }
      }
    }))
    .id('teams', teamId => ({
      teams: {
        some: {
          teamId
        }
      }
    }))
    .text('q', text => ({
      OR: [{ name: { contains: text } }, { description: { contains: text } }]
    }))
    .get()

  if (!requestedStatuses.length && applyCurrentWindow) {
    where.targetStatus = { in: [TargetStatus.RUNNING, TargetStatus.PAUSED, TargetStatus.NEW] }
  }

  const scopedWhere = getTargetScopedWhere(user, where)
  const { take, skip, paginate } = getPagination(query)
  const { orderBy } = getOrderBy(query, { dueAt: 'asc' })

  if (isTrue(query.options)) {
    const [total, rows] = await prisma.$transaction([
      prisma.task.count({ where: scopedWhere }),
      prisma.task.findMany({
        where: scopedWhere,
        skip,
        take,
        orderBy,
        select: {
          id: true,
          name: true
        }
      })
    ])
    return {
      data: paginate(rows, total)
    }
  }

  const [total, rows] = await prisma.$transaction([
    prisma.task.count({ where: scopedWhere }),
    prisma.task.findMany({
      where: scopedWhere,
      skip,
      take,
      orderBy,
      include: TargetInclude
    })
  ])

  return {
    data: paginate(rows, total)
  }
}

export default defineEventHandler(async event => {
  const { error, data } = await getTargets(event)
  if (error) throw error
  return data
})
