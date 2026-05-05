import { Prisma } from '~~/prisma/client/client'

export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event)
  if (!can(user, ['read-any-permissions'])) {
    throw err.denied()
  }

  const query = getQuery(event)

  const { take, skip, paginate } = getPagination(query)
  const { orderBy } = getOrderBy(query, { createdAt: 'desc' })

  const where = getWhere<Prisma.PermissionWhereInput>(query)
    .id('id')
    .text('name')
    .text('description')
    .date('createdAt')
    .date('updatedAt')
    .text('q', (text) => ({
      OR: [
        {
          name: {
            contains: text,
          },
        },
        {
          description: {
            contains: text,
          },
        },
      ],
    }))
    .id('roleIds', (roleId) => ({
      rolePermissions: {
        some: {
          roleId,
        },
      },
    }))
    .get()

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
