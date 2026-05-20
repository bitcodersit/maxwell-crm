import type { H3Event } from 'h3'
import type { Prisma } from '~~/prisma/client/client'
import { CUSTOMER_ROLE_NAME } from '~~/server/utils/customerRole'

export const getRoles = async (event: H3Event, query = getQuery(event)) => {
  const user = await getCurrentUser(event)
  if (!user.readAnyRoles) {
    return {
      error: err.denied()
    }
  }

  const { take, skip, paginate } = getPagination(query)
  const { orderBy } = getOrderBy(query, { createdAt: 'desc' })

  const where = getWhere<Prisma.RoleWhereInput>(query, { deletedAt: null })
    .id('id')
    .text('name')
    .text('description')
    .true('excludeCustomer', () => ({
      name: {
        not: CUSTOMER_ROLE_NAME
      }
    }))
    .date('createdAt')
    .date('updatedAt')
    .text('q', text => ({
      OR: [
        {
          name: {
            contains: text
          }
        },
        {
          description: {
            contains: text
          }
        }
      ]
    }))
    .id('permissionIds', permissionId => ({
      rolePermissions: {
        some: {
          permissionId
        }
      }
    }))
    .id('idsNotIn', ids => {
      if ('in' in ids) {
        return {
          id: {
            notIn: ids.in
          }
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
          name: true
        }
      }
    : {
        include: {
          rolePermissions: {
            select: {
              id: true,
              permission: {
                select: {
                  id: true,
                  name: true
                }
              }
            }
          }
        }
      }

  const [total, roles] = await prisma.$transaction([
    prisma.role.count({ where }),
    prisma.role.findMany({
      skip,
      take,
      where,
      orderBy,
      ...selectInclude
    })
  ])

  return {
    data: paginate(roles, total)
  }
}

export default defineEventHandler(async event => {
  const { error, data } = await getRoles(event)
  if (error) throw error
  return data
})
