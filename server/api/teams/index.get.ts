export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event)

  if (!can(user, ['read-any-team', 'read-own-team'])) {
    throw err.denied()
  }

  const query = getQuery(event)

  const { take, skip, paginate } = getPagination(query)
  const q = (query.q || '').toString().trim()

  const search = {
    OR: [{ name: { contains: q } }, { description: { contains: q } }],
    deletedAt: null,
  }

  const where = can(user, ['read-any-team'])
    ? search
    : {
        AND: [{ members: { some: { userId: user.id } } }, search],
      }

  const [total, teams] = await prisma.$transaction([
    prisma.team.count({ where }),
    prisma.team.findMany({
      where,
      skip,
      take,
      orderBy: {
        id: 'desc',
      },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        members: {
          select: {
            role: true,
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
            assigner: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
    }),
  ])

  return paginate(teams, total)
})
