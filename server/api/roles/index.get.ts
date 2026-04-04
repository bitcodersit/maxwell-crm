export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event)
  if (!can(session, ['read-any-role'])) {
    throw err.denied()
  }

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
          include: {
            permission: true,
          },
        },
      },
    }),
  ])
  return paginate(roles, total)
})
