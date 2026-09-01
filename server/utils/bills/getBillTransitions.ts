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
  const user = await getCurrentUser(event)
  const payload = await getBillTransitionPayload(input.id, user)
  if (!payload) throw err.notFound()

  return billTransitions.list(payload, payload.bill.status)
}
