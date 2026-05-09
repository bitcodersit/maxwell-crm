import type { H3Event } from 'h3'
import type { Prisma } from '~~/prisma/client/client'

const taskInclude = {
  creator: {
    select: {
      id: true,
      name: true,
      email: true,
      avatarId: true
    }
  },
  reviewer: {
    select: {
      id: true,
      name: true,
      email: true,
      avatarId: true
    }
  },
  users: {
    select: {
      id: true,
      userId: true,
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          avatarId: true
        }
      }
    }
  },
  teams: {
    select: {
      id: true,
      teamId: true,
      team: {
        select: {
          id: true,
          name: true,
          description: true
        }
      }
    }
  },
  items: {
    where: {
      deletedAt: null
    },
    orderBy: {
      sortOrder: 'asc' as const
    },
    select: {
      id: true,
      name: true,
      status: true,
      sortOrder: true,
      completedAt: true,
      completedById: true,
      completedBy: {
        select: {
          id: true,
          name: true
        }
      }
    }
  },
  attachables: {
    select: {
      id: true,
      attachmentId: true,
      attachment: {
        select: {
          id: true,
          name: true,
          path: true,
          mime: true,
          size: true,
          provider: true,
          createdAt: true
        }
      }
    }
  }
}

const getTaskScopedWhere = (user: { id: number }, where: Prisma.TaskWhereInput) => {
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
      include: taskInclude
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
