import type { H3Event } from 'h3'
import { z } from 'zod'

export type TZGetVisits = z.infer<typeof zGetVisits>
export const zGetVisits = z
  .object({
    authorId: zId().nullish(),
    status: z.enum(VisitStatus).nullish(),
    orderBy: zOrderByRecord(['date']).default([
      {
        date: 'desc'
      }
    ])
  })
  .and(zPagination())
  .and(zVisitLeadOrProperty)

export const getVisits = async (event: H3Event, options?: { input?: TZGetVisits }) => {
  const user = await getCurrentUser(event)
  const input = await getInput(event, zGetVisits, options)

  const where = getWhere2<Prisma.VisitWhereInput, TZGetVisits>(input)
    .id('authorId')
    .id('status')
    .id('leadId')
    .id('propertyId')
    .extend({
      deletedAt: null
    })
    .scope(v => getScopedVisit(v, user))
    .get()

  const { take, skip, paginate } = getPagination(input)
  const [total, visits] = await prisma.$transaction([
    prisma.visit.count({ where }),
    prisma.visit.findMany({
      take,
      skip,
      where,
      orderBy: input.orderBy,
      ...selectVisit()
    })
  ])

  return paginate(visits, total)
}
