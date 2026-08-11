import type { H3Event } from 'h3'
import { TaskKind } from '~~/prisma/client/enums'

const getTaskScopedWhere = (user: TUser, where: Prisma.TaskWhereInput) => {
  if (user.readAnyTasks) return where
  return {
    AND: [
      where,
      {
        OR: [
          { creatorId: user.id },
          { reviewerId: user.id },
          { submitterId: user.id },
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
  const user = await getCurrentUser(event)
  if (!user.readAnyTasks || !user.readOwnTasks) {
    return {
      error: err.denied()
    }
  }

  const where = getWhere<Prisma.TaskWhereInput>(query, {
    deletedAt: null,
    kind: TaskKind.TASK
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
