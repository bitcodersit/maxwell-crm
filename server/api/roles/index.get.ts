import type { H3Event } from 'h3'
import { Prisma } from '~~/prisma/client/client'

export const getRoles = async (event: H3Event, query = getQuery(event)) => {
  const { user } = await requireUserSession(event)
  if (!can(user, ['read-any-roles'])) {
    return {
      error: err.denied(),
    }
  }

  const { take, skip, paginate } = getPagination(query)
  const { orderBy } = getOrderBy(query, { createdAt: 'desc' })

  const where = getWhere<Prisma.RoleWhereInput>(query)
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
    .id('permissionIds', (permissionId) => ({
      rolePermissions: {
        some: {
          permissionId,
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
    select?: Prisma.RoleSelect
    include?: Prisma.RoleInclude
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
              permission: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        },
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

  return {
    data: paginate(roles, total),
  }
}

export default defineEventHandler(async (event) => {
  const { error, data } = await getRoles(event)
  if (error) throw error
  return data
})
