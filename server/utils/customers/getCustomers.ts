import type { H3Event } from 'h3'
import { z } from 'zod'

export type TZGetCustomers = z.infer<typeof zGetCustomers>
export const zGetCustomers = z
  .object({
    q: z.string().trim().nullish(),
    id: zIds(),
    phone: z.string().trim().nullish(),
    idsNotIn: zIds(),
    createdAt: zDateObject().nullish(),
    updatedAt: zDateObject().nullish(),
    options: zBoolean().default(false),
    orderBy: zOrderByRecord(['id', 'name', 'phone', 'creatorId', 'createdAt', 'updatedAt'])
  })
  .and(zPagination())

export const getCustomers = async (
  event: H3Event,
  options?: {
    input?: TZGetCustomers
  }
) => {
  const user = await getCurrentUser(event)
  if (!user.readAnyUsers) {
    throw err.denied()
  }

  const input = options?.input ?? (await validate(getQuery(event), zGetCustomers))
  const orderBy = getOrderBy2(input.orderBy, {
    creatorId(order) {
      return {
        creator: {
          name: order
        }
      }
    }
  })

  const where = getWhere2<Prisma.UserWhereInput, TZGetCustomers>(input)
    .id('id')
    .text('q', ['name', 'phone'])
    .text('phone')
    .date('createdAt')
    .date('updatedAt')
    .id('idsNotIn', ids => {
      if ('in' in ids) {
        return {
          id: {
            notIn: ids.in
          }
        }
      }
    })
    .extend({
      deletedAt: null,
      userRoles: {
        some: {
          role: {
            name: CUSTOMER_ROLE_NAME
          }
        }
      }
    })
    .get()

  const { take, skip, paginate } = getPagination(input)
  const [total, customers] = await prisma.$transaction([
    prisma.user.count({ where }),
    prisma.user.findMany({
      skip,
      take,
      where,
      orderBy,
      ...selectCustomer({
        user,
        options: input.options
      })
    })
  ])

  return paginate(customers, total)
}
