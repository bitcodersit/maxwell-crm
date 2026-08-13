import type { H3Event } from 'h3'
import z from 'zod'

export type TZGetUsers = z.infer<typeof zGetUsers>
export const zGetUsers = z
  .object({
    q: z.string().trim().nullish(),
    id: zIds(),
    email: z.string().trim().nullish(),
    roleIds: zIds(),
    roleNames: zArray(z.array(z.string().trim().min(1))).optional(),
    creatorId: zIds(),
    idsNotIn: zIds(),
    isMemberOfTeam: zBoolean().nullish(),
    isCreatorOfTeam: zBoolean().nullish(),
    createdAt: zDateObject().nullish(),
    updatedAt: zDateObject().nullish(),
    deletedAt: zDateObject().nullish(),
    options: zBoolean().default(false),
    orderBy: zOrderByRecord([
      'id',
      'name',
      'email',
      'phone',
      'creatorId',
      'createdAt',
      'updatedAt',
      'deletedAt'
    ])
      .default([
        {
          id: 'desc'
        }
      ] as any)
      .nullish()
  })
  .and(zPagination())

export const getUsers = async (
  event: H3Event,
  options?: {
    input?: TZGetUsers
    trashed?: boolean
  }
) => {
  const user = await getCurrentUser(event)
  if (!user.readAnyUsers && !user.readOwnUsers) {
    return err.denied()
  }

  const input = options?.input ?? (await validate(getQuery(event), zGetUsers))
  const orderBy = getOrderBy2(input.orderBy, {
    creatorId(order) {
      return {
        creator: {
          name: order
        }
      }
    }
  })

  const where = getWhere2<Prisma.UserWhereInput, TZGetUsers>(input)
    .id('id')
    .id('creatorId')
    .text('q', ['name', 'email', 'phone'])
    .text('email')
    .date('createdAt')
    .date('updatedAt')
    .date('deletedAt')
    .id('roleIds', roleId => ({
      userRoles: {
        some: {
          roleId
        }
      }
    }))
    .extend(
      input.roleNames?.length
        ? {
            userRoles: {
              some: {
                role: {
                  name: {
                    in: input.roleNames
                  }
                }
              }
            }
          }
        : {}
    )
    .id('idsNotIn', ids => {
      if ('in' in ids) {
        return {
          id: {
            notIn: ids.in
          }
        }
      }
    })
    .true('isCreatorOfTeam', () => ({
      teams: {
        some: {
          deletedAt: null
        }
      }
    }))
    .true('isMemberOfTeam', () => ({
      teamMembers: {
        some: {
          team: {
            deletedAt: null
          }
        }
      }
    }))
    .extend({
      deletedAt: options?.trashed ? { not: null } : null,
      userRoles: {
        none: {
          role: {
            name: CUSTOMER_ROLE_NAME
          }
        }
      }
    })
    .scope(v => getScopedUser(v, user))
    .get()

  const { take, skip, paginate } = getPagination(input)
  const [total, users] = await prisma.$transaction([
    prisma.user.count({ where }),
    prisma.user.findMany({
      skip,
      take,
      where,
      orderBy,
      ...selectUser({
        user,
        options: input.options
      })
    })
  ])

  return paginate(users, total)
}
