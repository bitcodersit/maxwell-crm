import type { H3Event } from 'h3'
import z from 'zod'

export type TZGetBills = z.infer<typeof zGetBills>
export const zGetBills = z
  .object({
    q: z.string().trim().nullish(),
    id: zIds(),
    userId: zIds(),
    authorId: zIds(),
    reviewerId: zIds(),
    typeId: zIds(),
    status: z
      .union([zBillStatus, z.array(zBillStatus)])
      .transform(v => (Array.isArray(v) ? v : v ? [v] : undefined))
      .nullish(),
    date: zDateObject().nullish(),
    createdAt: zDateObject().nullish(),
    updatedAt: zDateObject().nullish(),
    options: zBoolean().default(false),
    orderBy: zOrderByRecord([
      'id',
      'date',
      'amount',
      'status',
      'userId',
      'authorId',
      'reviewerId',
      'typeId',
      'createdAt',
      'updatedAt'
    ])
      .default([
        {
          id: 'desc'
        }
      ] as any)
      .nullish()
  })
  .and(zPagination())

export const getBills = async (event: H3Event, options?: { input?: TZGetBills }) => {
  const user = await getCurrentUser(event)
  if (!user.readAnyBills && !user.readOwnBills) {
    throw err.denied()
  }

  const input = options?.input ?? (await validate(getQuery(event), zGetBills))

  const orderBy = getOrderBy2(input.orderBy, {
    userId(order) {
      return {
        user: {
          name: order
        }
      }
    },
    authorId(order) {
      return {
        author: {
          name: order
        }
      }
    },
    reviewerId(order) {
      return {
        reviewer: {
          name: order
        }
      }
    },
    typeId(order) {
      return {
        type: {
          name: order
        }
      }
    }
  })

  const where = getWhere2<Prisma.BillWhereInput, any>(input)
    .id('id')
    .id('userId')
    .id('authorId')
    .id('reviewerId')
    .id('typeId')
    .text('q', ['purpose'])
    .date('date')
    .date('createdAt')
    .date('updatedAt')
    .extend({
      deletedAt: null,
      ...(input.status?.length
        ? ({
            status: {
              in: input.status
            }
          } as any)
        : {})
    })
    .scope(v => getScopedBill(v, user))
    .get()

  const { take, skip, paginate } = getPagination(input)
  const [total, bills] = await prisma.$transaction([
    prisma.bill.count({ where }),
    prisma.bill.findMany({
      skip,
      take,
      where,
      orderBy,
      ...selectBill({
        user,
        options: input.options
      })
    })
  ])

  if (input.options) {
    return paginate(bills, total)
  }

  const data = bills.map((bill: any) => ({
    ...bill,
    workflow: getBillWorkflow({
      status: bill.status,
      isAdmin: !!user.updateAnyBills,
      isAuthor: bill.author?.id === user.id
    })
  }))

  return paginate(data, total)
}
