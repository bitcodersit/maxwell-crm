export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event)
  if (!can(session, ['read-any-permission'])) {
    throw err.denied()
  }

  const query = getQuery(event)

  const q = (query.q || '').toString().trim()
  const orderBy = (query.orderBy || 'name').toString().trim()
  const orderDirection = (query.orderDirection || 'desc').toString().trim()

  const { take, skip, paginate } = getPagination(query)

  const where = {
    OR: [{ name: { contains: q } }, { slug: { contains: q } }],
  }

  const [total, permissions] = await prisma.$transaction([
    prisma.permission.count({ where }),
    prisma.permission.findMany({
      skip,
      take,
      where,
      orderBy: {
        [orderBy]: orderDirection,
      },
    }),
  ])

  return paginate(permissions, total)
})
