import type { H3Event } from 'h3'
import z from 'zod'
import { BillTransitions, billTransitions } from './transition'

export type TZPostBillTransition = z.infer<typeof zPostBillTransition>
export const zPostBillTransition = z.object({
  id: zId(),
  transition: z.enum(BillTransitions)
})

export const postBillTransition = async (
  event: H3Event,
  options?: {
    input?: TZPostBillTransition
  }
) => {
  const user = await getCurrentUser(event)
  const input = await getInput(event, zPostBillTransition, options)
  const payload = await getBillTransitionPayload(input.id, user)
  if (!payload) throw err.notFound()

  const transition = billTransitions.init(payload.bill.status, payload)
  const [error] = await transition.apply(input.transition)
  if (error) {
    return createError({
      statusCode: 422,
      statusMessage: 'Unprocessable Entity',
      message: error.message
    })
  }

  return {
    message: 'Bill status changed successfully'
  }
}
