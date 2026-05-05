import { Prisma } from '~~/prisma/client/client'

export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event)
  if (!can(user, ['read-any-permissions'])) {
    throw err.denied()
  }

  const query = getQuery(event)
  const where: Prisma.PermissionWhereInput = {
    deletedAt: null,
  }

  const { take, skip, paginate } = getPagination(query)
  const { orderBy } = getOrderBy(query, { createdAt: 'desc' })

  // filter by ids
  const id = getQueryId(query, 'id')
  if (id) where.id = id

  // filter by search text
  const { contains } = getQueryQ(query)
  if (contains) where.OR = [{ name: { contains } }, { description: { contains } }]

  // filter by name
  const name = (query.name || '').toString().trim()
  const nameMode = (query.nameMode || 'contains').toString().trim()
  if (name) where.name = nameMode === 'contains' ? { contains: name } : name

  // filter by description
  const desc = (query.description || '').toString().trim()
  const descMode = (query.descriptionMode || 'contains').toString().trim()
  if (desc) where.description = descMode === 'contains' ? { contains: desc } : desc

  // filter by role ids
  const roleId = getQueryId(query, 'roleIds')
  if (roleId) where.rolePermissions = { some: { roleId } }

  // filter by dates
  whereDate(where, query, 'createdAt')
  whereDate(where, query, 'updatedAt')

  const selectInclude: {
    select?: Prisma.PermissionSelect
    include?: Prisma.PermissionInclude
  } = isTrue(query.options)
    ? {
        select: {
          id: true,
          name: true,
        },
      }
    : {
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
      }

  const [total, permissions] = await prisma.$transaction([
    prisma.permission.count({ where }),
    prisma.permission.findMany({
      skip,
      take,
      where,
      orderBy,
      ...selectInclude,
    }),
  ])

  return paginate(permissions, total)
})
