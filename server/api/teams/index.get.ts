import { Prisma } from '~~/prisma/client/client'

export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event)

  if (!can(user, ['read-any-teams', 'read-own-teams'])) {
    throw err.denied()
  }

  const query = getQuery(event)

  const { take, skip, paginate } = getPagination(query)
  const { orderBy } = getOrderBy(query, { id: 'desc' })

  const where = getWhere<Prisma.TeamWhereInput>(query, { deletedAt: null })
    .id('id')
    .text('name')
    .text('description')
    .id('creatorId')
    .date('createdAt')
    .date('updatedAt')
    .text('q', (text) => ({
      OR: [{ name: { contains: text } }, { description: { contains: text } }]
    }))
    .id('memberUserIds', (userId) => ({
      members: {
        some: {
          userId
        }
      }
    }))
    .get()

  const scopedWhere = can(user, ['read-any-teams'])
    ? where
    : {
        AND: [where, { members: { some: { userId: user.id } } }]
      }

  const [total, teams] = await prisma.$transaction([
    prisma.team.count({ where: scopedWhere }),
    prisma.team.findMany({
      where: scopedWhere,
      skip,
      take,
      orderBy,
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarId: true,
          },
        },
        members: {
          orderBy: {
            role: 'asc',
          },
          select: {
            role: true,
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                avatarId: true,
              },
            },
            assigner: {
              select: {
                id: true,
                name: true,
                email: true,
                avatarId: true,
              },
            },
          },
        },
      },
    }),
  ])

  return paginate(teams, total)
})
