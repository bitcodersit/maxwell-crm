import type { H3Event } from 'h3'
import { Prisma } from '~~/prisma/client/client'

export const getUsers = async (event: H3Event, query = getQuery(event)) => {
  const { user } = await requireUserSession(event)
  if (!can(user, ['read-any-users'])) {
    return {
      error: err.denied(),
    }
  }

  const { take, skip, paginate } = getPagination(query)
  const { orderBy } = getOrderBy(query, { createdAt: 'desc' })

  const baseWhere = getWhere<Prisma.UserWhereInput>(query)
    .id('id')
    .text('name')
    .text('email')
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
          email: {
            contains: text,
          },
        },
      ],
    }))
    .id('roleIds', (roleId) => ({
      userRoles: {
        some: {
          roleId,
        },
      },
    }))
    .get()

  const where: Prisma.UserWhereInput = {
    deletedAt: null,
    ...baseWhere,
  }

  const [total, users] = await prisma.$transaction([
    prisma.user.count({ where }),
    prisma.user.findMany({
      skip,
      take,
      where,
      orderBy,
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
        updatedAt: true,
        deletedAt: true,
        userRoles: {
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
    }),
  ])

  return {
    data: paginate(users, total),
  }
}

export default defineEventHandler(async (event) => {
  const { error, data } = await getUsers(event)
  if (error) throw error
  return data
})
