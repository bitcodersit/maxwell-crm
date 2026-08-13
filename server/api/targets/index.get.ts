import type { H3Event } from 'h3'

const getTargetScopedWhere = (user: TUser, where: Prisma.TaskWhereInput) => {
  if (user.readAnyTargets) return where
  return {
    AND: [where, getTaskOwnScope(user.id)]
  } satisfies Prisma.TaskWhereInput
}

export const getTargets = async (event: H3Event, query = getQuery(event)) => {
  const user = await getCurrentUser(event)
  if (!user.readAnyTargets || !user.readOwnTargets) {
    return {
      error: err.denied()
    }
  }

  await ensureTargetOccurrences(user.id)

  const where = getWhere<Prisma.TaskWhereInput>(query, {
    deletedAt: null,
    ...targetOccurrenceWhere()
  })
    .id('id')
    .text('name')
    .text('description')
    .array('status')
    .array('priority')
    .id('creatorId')
    .id('reviewerId')
    .id('submitterId')
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

  const scopedWhere = getTargetScopedWhere(user, where)
  const { take, skip, paginate } = getPagination(query)
  const { orderBy } = getOrderBy(query, { createdAt: 'desc' })

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
