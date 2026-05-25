import type { H3Event } from 'h3'
import z from 'zod'
import { billTransitions } from './transition'

export type TZGetBillTransitions = z.infer<typeof zGetBillTransitions>
export const zGetBillTransitions = z.object({
  id: zId()
})

export const getBillTransitions = async (
  event: H3Event,
  options?: {
    input?: TZGetBillTransitions
  }
) => {
  const input = await getInput(event, zGetBillTransitions, options)
  const bill = await prisma.bill.findUnique({
    where: {
      id: input.id
    },
    select: {
      status: true
    }
  })

  if (!bill) throw err.notFound()

  const user = await getCurrentUser(event)
  return billTransitions.list({ user }, bill.status)
}
