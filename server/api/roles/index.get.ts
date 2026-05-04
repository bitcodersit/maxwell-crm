import { Prisma } from '~~/prisma/client/client'

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

  const selectInclude: {
    select?: Prisma.RoleSelect
    include?: Prisma.RoleInclude
  } = {}

  if (isTrue(query.options)) {
    selectInclude.select = {
      id: true,
      name: true,
    }
  } else {
    selectInclude.include = {
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
    }
  }

  const [total, roles] = await prisma.$transaction([
    prisma.role.count({ where }),
    prisma.role.findMany({
      skip,
      take,
      where,
      orderBy,
      ...selectInclude,
    }),
  ])

  return paginate(roles, total)
})
