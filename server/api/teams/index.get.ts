export default defineEventHandler(async (event) => {
  const query = getQuery(event)

  const { take, skip, paginate } = getPagination(query)
  const q = (query.q || '').toString().trim()

  const where = {
    OR: [{ name: { contains: q } }, { description: { contains: q } }],
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
