export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event)
  if (!can(user, ['read-any-roles'])) {
    throw err.denied()
  }

  const query = getQuery(event)

  const { take, skip, paginate } = getPagination(query)
  const { orderBy } = getOrderBy(query)

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
              },
            },
          },
        },
      },
    }),
  ])

  return paginate(roles, total)
})
