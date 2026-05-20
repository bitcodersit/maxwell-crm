import type { H3Event } from 'h3'
import type { Prisma } from '~~/prisma/client/client'
import { CUSTOMER_ROLE_NAME } from '~~/server/utils/customerRole'

export const getCustomers = async (event: H3Event, query = getQuery(event)) => {
  const user = await getCurrentUser(event)
  if (!user.readAnyUsers) {
    return {
      error: err.denied()
    }
  }

  const { take, skip, paginate } = getPagination(query)
  const { orderBy } = getOrderBy(query, { createdAt: 'desc' })

  const where = getWhere<Prisma.UserWhereInput>(query, {
    deletedAt: null,
    userRoles: {
      some: {
        role: {
          name: CUSTOMER_ROLE_NAME
        }
      }
    }
  })
    .id('id')
    .text('name')
    // .text('email')
    .text('phone')
    .date('createdAt')
    .date('updatedAt')
    .text('q', text => ({
      OR: [
        {
          name: {
            contains: text
          }
        },
        // {
        //   email: {
        //     contains: text
        //   }
        // },
        {
          phone: {
            contains: text
          }
        }
      ]
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
    select?: Prisma.UserSelect
  } = isTrue(query.options)
    ? {
        select: {
          id: true,
          name: true,
          // email: true,
          // phone: true,
          avatarId: true
        }
      }
    : {
        select: {
          id: true,
          name: true,
          creator: {
            select: {
              id: true,
              name: true
            }
          },
          // email: true,
          phone: true,
          avatarId: true,
          createdAt: true,
          updatedAt: true,
          userRoles: {
            select: {
              id: true,
              role: {
                select: {
                  id: true,
                  name: true
                }
              }
            }
          }
        }
      }

  const [total, customers] = await prisma.$transaction([
    prisma.user.count({ where }),
    prisma.user.findMany({
      skip,
      take,
      where,
      orderBy,
      ...selectInclude
    })
  ])

  return {
    data: paginate(customers, total)
  }
}

export default defineEventHandler(async event => {
  const { error, data } = await getCustomers(event)
  if (error) throw error
  return data
})
