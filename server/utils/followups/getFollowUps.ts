import type { H3Event } from 'h3'
import { z } from 'zod'

export type TZGetFollowUps = z.infer<typeof zGetFollowUps>
export const zGetFollowUps = z
  .object({
    leadId: zId(),
    authorId: zId().nullish(),
    type: z.enum(FollowUpType).nullish(),
    status: z.enum(FollowUpStatus).nullish(),
    orderBy: zOrderByRecord(['date']).default([
      {
        date: 'desc'
      }
    ])
  })
  .and(zPagination())

export const getFollowUps = async (event: H3Event, options?: { input?: TZGetFollowUps }) => {
  const user = await getCurrentUser(event)
  const input = await getInput(event, zGetFollowUps, options)

  const where = getWhere2<Prisma.FollowUpWhereInput, TZGetFollowUps>(input)
    .id('leadId')
    .id('authorId')
    .id('type')
    .id('status')
    .extend({
      deletedAt: null
    })
    .scope(v => getScopedFollowUp(v, user))
    .get()

  const { take, skip, paginate } = getPagination(input)
  const [total, followUps] = await prisma.$transaction([
    prisma.followUp.count({ where }),
    prisma.followUp.findMany({
      take,
      skip,
      where,
      orderBy: input.orderBy,
      ...selectFollowUp()
    })
  ])

  return paginate(followUps, total)
}
