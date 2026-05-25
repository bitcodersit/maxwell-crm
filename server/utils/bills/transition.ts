import { createTransitions } from '../transitions'

export const BillTransitions = ['submit', 'cancel', 'approve', 'reject'] as const
export type TBillTransition = (typeof BillTransitions)[number]

type TContext = {
  bill: TBill
  user: TUser
  reviewedAt?: Date | null
  reviewerId?: number | null
}

const notifyBillStatusChange = async ({ bill, user }: TContext) => {
  if (!['Pending', 'Approved', 'Rejected'].includes(bill.status)) return

  const admins = await prisma.user.findMany({
    where: {
      deletedAt: null,
      email: {
        not: null
      },
      userRoles: {
        some: {
          role: {
            rolePermissions: {
              some: {
                permission: {
                  name: 'update-any-bills'
                }
              }
            }
          }
        }
      }
    },
    select: {
      email: true
    }
  })

  const recipients = Array.from(
    new Set([...admins.map(v => v.email), bill.user?.email ?? null].filter(Boolean))
  ) as string[]

  if (!recipients.length) return

  const amount = Number(bill.amount || 0).toFixed(2)
  const subject = `Conveyance Bill #${bill.id} is now ${bill.status}`
  const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #111827;">
      <h2 style="margin: 0 0 10px;">Conveyance Bill Status Updated</h2>
      <p style="margin: 0 0 12px;">
        Bill <b>#${bill.id}</b> has been marked as <b>${bill.status}</b> by <b>${user.name || 'System'}</b>.
      </p>
      <table style="border-collapse: collapse; width: 100%; max-width: 560px;">
        <tr><td style="padding: 6px 8px; border: 1px solid #e5e7eb;">Employee</td><td style="padding: 6px 8px; border: 1px solid #e5e7eb;">${bill.user?.name || '—'}</td></tr>
        <tr><td style="padding: 6px 8px; border: 1px solid #e5e7eb;">Author</td><td style="padding: 6px 8px; border: 1px solid #e5e7eb;">${bill.author?.name || '—'}</td></tr>
        <tr><td style="padding: 6px 8px; border: 1px solid #e5e7eb;">Type</td><td style="padding: 6px 8px; border: 1px solid #e5e7eb;">${bill.type?.name || '—'}</td></tr>
        <tr><td style="padding: 6px 8px; border: 1px solid #e5e7eb;">Date</td><td style="padding: 6px 8px; border: 1px solid #e5e7eb;">${new Date(bill.date).toLocaleDateString()}</td></tr>
        <tr><td style="padding: 6px 8px; border: 1px solid #e5e7eb;">Amount</td><td style="padding: 6px 8px; border: 1px solid #e5e7eb;">${amount}</td></tr>
        <tr><td style="padding: 6px 8px; border: 1px solid #e5e7eb;">Purpose</td><td style="padding: 6px 8px; border: 1px solid #e5e7eb;">${bill.purpose || '—'}</td></tr>
      </table>
    </div>
  `

  await queueEmail({
    to: recipients,
    subject,
    html
  })
}

export const billTransitions = createTransitions<TBillStatus, TBillTransition, TContext>({
  states: Object.values(BillStatus),
  transitions: [
    {
      name: 'submit',
      from: BillStatus.New,
      to: BillStatus.Pending,
      meta: {
        title: 'Submit for review',
        color: 'primary',
        description: 'Submit the bill for review by the admin'
      },
      payload: () => {
        return {
          reviewedAt: null,
          reviewerId: null
        }
      }
    },
    {
      name: 'approve',
      from: BillStatus.Pending,
      to: BillStatus.Approved,
      meta: {
        title: 'Approve the bill',
        color: 'success',
        description: 'Approve the bill by the admin'
      },
      hidden: v => {
        return !v?.user?.updateAnyBills
      },
      payload: ({ payload: { user } }) => {
        return {
          reviewedAt: new Date(),
          reviewerId: user.id
        }
      }
    },
    {
      name: 'reject',
      from: BillStatus.Pending,
      to: BillStatus.Rejected,
      meta: {
        title: 'Reject the bill',
        description: 'Reject the bill by the admin'
      },
      hidden: v => {
        return !v?.user?.updateAnyBills
      },
      payload: ({ payload: { user } }) => {
        return {
          reviewedAt: new Date(),
          reviewerId: user.id
        }
      }
    },
    {
      name: 'cancel',
      from: [BillStatus.New, BillStatus.Pending],
      to: BillStatus.Cancelled
    }
  ],
  onCheck({ payload }) {
    if (!payload) return false
    return !!payload.user.updateAnyBills || payload.bill.userId === payload.user.id
  },
  onMutate({ state, payload }): Promise<TBill> {
    if (!payload) throw new Error('Payload is required')
    const data: Prisma.BillUncheckedUpdateInput = {
      status: state
    }
    if (payload.reviewedAt !== undefined) {
      data.reviewedAt = payload.reviewedAt
    }
    if (payload.reviewerId !== undefined) {
      data.reviewerId = payload.reviewerId
    }
    return prisma.bill.update({
      where: { id: payload.bill.id },
      data
    })
  },
  onSuccess(context) {
    if (!context.payload) throw new Error('Payload is required')
    // notify the user about the status change
    notifyBillStatusChange(context.payload)
  },
  onError(context) {
    // notify the user about the status change
    console.log('onError', context)
  }
})
