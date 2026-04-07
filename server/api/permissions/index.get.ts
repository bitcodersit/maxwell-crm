export default defineEventHandler(async (event) => {
  // const session = await requireUserSession(event)
  // if (!can(session, ['read-any-permission'])) {
  //   throw err.denied()
  // }

  const query = getQuery(event)

  const { take, skip, paginate } = getPagination(query)
  const { orderBy } = getOrderBy(query, 'id', 'desc')

  const q = (query.q || '').toString().trim()
  const where = {
    OR: [{ name: { contains: q } }, { slug: { contains: q } }],
  }

  const [total, permissions] = await prisma.$transaction([
    prisma.permission.count({ where }),
    prisma.permission.findMany({
      skip,
      take,
      where,
      orderBy,
      include: {
        rolePermissions: {
          select: {
            id: true,
            role: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    }),
  ])

  return paginate(permissions, total)
})
