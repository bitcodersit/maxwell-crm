import type { H3Event } from 'h3'
import z from 'zod'

export type TZGetBill = z.infer<typeof zGetBill>
export const zGetBill = z.object({
  id: zId().nullish()
})

export const getBill = async (event: H3Event, options?: { input?: TZGetBill }) => {
  const user = await getCurrentUser(event)
  if (!canReadBills(user)) {
    throw err.denied()
  }

  const input = options?.input ?? (await validate(getQuery(event), zGetBill))
  const where = getWhere2<Prisma.BillWhereInput, TZGetBill>(input)
    .id('id')
    .extend({ deletedAt: null })
    .scope(v => getScopedBill(v, user))
    .get()

  const data = await prisma.bill.findFirst({
    where,
    ...selectBill({
      user
    })
  })

  if (!data) throw err.notFound()
  return data
}
