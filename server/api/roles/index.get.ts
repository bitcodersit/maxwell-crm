export default defineEventHandler(async (event) => {
  // const session = await requireUserSession(event)
  // if (!can(session, ['read-any-role'])) {
  //   throw err.denied()
  // }

  const query = getQuery(event)

  const { take, skip, paginate } = getPagination(query)
  const { orderBy } = getOrderBy(query, 'id', 'desc')

  const q = (query.q || '').toString().trim()
  const where = {
    OR: [{ name: { contains: q } }],
  }

  const [total, roles] = await prisma.$transaction([
    prisma.role.count({ where }),
    prisma.role.findMany({
      skip,
      take,
      where,
      orderBy,
      include: {
        rolePermissions: {
          select: {
            id: true,
            permission: {
              select: {
                id: true,
                name: true,
                slug: true,
              },
            },
          },
        },
      },
    }),
  ])

  return paginate(roles, total)
})
