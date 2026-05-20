import type { H3Event } from 'h3'
import type { Prisma } from '~~/prisma/client/client'

export const getTeams = async (event: H3Event, query = getQuery(event)) => {
  const user = await getCurrentUser(event)
  if (!user.readAnyTeams || !user.readOwnTeams) {
    return {
      error: err.denied()
    }
  }

  const { take, skip, paginate } = getPagination(query)
  const { orderBy } = getOrderBy(query, { id: 'desc' })

  const where = getWhere<Prisma.TeamWhereInput>(query, { deletedAt: null })
    .id('id')
    .text('name')
    .text('description')
    .id('creatorId')
    .date('createdAt')
    .date('updatedAt')
    .text('q', text => ({
      OR: [{ name: { contains: text } }, { description: { contains: text } }]
    }))
    .id('memberUserIds', userId => ({
      members: {
        some: {
          userId
        }
      }
    }))
    .get()

  const scopedWhere: Prisma.TeamWhereInput = user.readAnyTeams
    ? where
    : {
        AND: [where, { members: { some: { userId: user.id } } }]
      }

  const selectInclude: {
    select?: Prisma.TeamSelect
    include?: Prisma.TeamInclude
  } = isTrue(query.options)
    ? {
        select: {
          id: true,
          name: true
        }
      }
    : {
        include: {
          creator: {
            select: UserSelectForOptions
          },
          members: {
            orderBy: {
              role: 'asc'
            },
            select: {
              role: true,
              user: {
                select: UserSelectForOptions
              },
              assigner: {
                select: UserSelectForOptions
              }
            }
          }
        }
      }

  const [total, teams] = await prisma.$transaction([
    prisma.team.count({ where: scopedWhere }),
    prisma.team.findMany({
      where: scopedWhere,
      skip,
      take,
      orderBy,
      ...selectInclude
    })
  ])

  return {
    data: paginate(teams, total)
  }
}

export default defineEventHandler(async event => {
  const { error, data } = await getTeams(event)
  if (error) throw error
  return data
})
