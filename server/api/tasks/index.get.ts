import type { UserSessionRequired } from '#auth-utils'
import type { H3Event } from 'h3'
import type { Prisma } from '~~/prisma/client/client'

const getTaskScopedWhere = (user: UserSessionRequired['user'], where: Prisma.TaskWhereInput) => {
  if (can(user, ['read-any-tasks'])) return where
  return {
    AND: [
      where,
      {
        OR: [
          { creatorId: user.id },
          { reviewerId: user.id },
          { users: { some: { userId: user.id } } },
          {
            teams: {
              some: {
                team: {
                  members: {
                    some: {
                      userId: user.id
                    }
                  }
                }
              }
            }
          }
        ]
      }
    ]
  } satisfies Prisma.TaskWhereInput
}

export const getTasks = async (event: H3Event, query = getQuery(event)) => {
  const { user } = await requireUserSession(event)
  if (!can(user, ['read-any-tasks', 'read-own-tasks'])) {
    return {
      error: err.denied()
    }
  }

  const where = getWhere<Prisma.TaskWhereInput>(query, { deletedAt: null })
    .id('id')
    .text('name')
    .text('description')
    .text('status', status => ({
      status: status as any
    }))
    .text('priority', priority => ({
      priority: priority as any
    }))
    .id('creatorId')
    .id('reviewerId')
    .date('dueAt')
    .date('createdAt')
    .date('updatedAt')
    .id('userIds', userId => ({
      users: {
        some: {
          userId
        }
      }
    }))
    .id('teamIds', teamId => ({
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

  const scopedWhere = getTaskScopedWhere(user, where)
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
      include: TaskInclude
    })
  ])

  return {
    data: paginate(rows, total)
  }
}

export default defineEventHandler(async event => {
  const { error, data } = await getTasks(event)
  if (error) throw error
  return data
})
