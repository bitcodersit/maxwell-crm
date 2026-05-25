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

  const bill = await prisma.bill.findUnique({
    where: {
      id: input.id
    },
    select: {
      id: true,
      date: true,
      amount: true,
      status: true,
      purpose: true,
      userId: true,
      user: selectUserForEmail,
      type: {
        select: {
          name: true
        }
      }
    }
  })

  if (!bill) throw err.notFound()
  const transition = billTransitions.init(bill.status, {
    user,
    bill: bill as TBill
  })

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
