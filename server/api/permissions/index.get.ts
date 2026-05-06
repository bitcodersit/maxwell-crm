import type { H3Event } from 'h3'
import { Prisma } from '~~/prisma/client/client'

export const getPermissions = async (event: H3Event, query = getQuery(event)) => {
  const { user } = await requireUserSession(event)
  if (!can(user, ['read-any-permissions'])) {
    return {
      error: err.denied(),
    }
  }

  const { take, skip, paginate } = getPagination(query)
  const { orderBy } = getOrderBy(query, { createdAt: 'desc' })

  const where = getWhere<Prisma.PermissionWhereInput>(query, { deletedAt: null })
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
    .id('idsNotIn', (ids) => {
      if ('in' in ids) {
        return {
          id: {
            notIn: ids.in,
          },
        }
      }
      return {}
    })
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

  return {
    data: paginate(permissions, total),
  }
}

export default defineEventHandler(async (event) => {
  const { error, data } = await getPermissions(event)
  if (error) throw error
  return data
})
