import type { H3Event } from 'h3'
import z from 'zod'
import { BillStatusLabel } from './status'
import { applyBillTransition, getBillTransitionMessage, getBillWorkflow } from './workflow'

const BillActions = ['submit', 'approve', 'reject', 'cancel'] as const
type TBillAction = (typeof BillActions)[number]

export type TZChangeBillStatus = z.infer<typeof zChangeBillStatus>
export const zChangeBillStatus = z.object({
  action: z.enum(BillActions)
})

const getStatusUpdateData = (action: TBillAction, userId: number): Record<string, any> => {
  if (action === 'submit') {
    return {
      status: 'Pending' as any,
      reviewedAt: null,
      reviewer: { disconnect: true }
    }
  }
  if (action === 'approve') {
    return {
      status: 'Approved' as any,
      reviewedAt: new Date(),
      reviewer: getConnect(userId)
    }
  }
  if (action === 'reject') {
    return {
      status: 'Rejected' as any,
      reviewedAt: new Date(),
      reviewer: getConnect(userId)
    }
  }
  return {
    status: 'Cancelled' as any
  }
}

const notifyBillStatusChange = async (
  bill: {
    id: number
    date: Date
    amount: Prisma.Decimal
    status: string
    purpose: string | null
    user?: { name: string | null; email: string | null } | null
    author?: { name: string | null; email: string | null } | null
    type?: { name: string } | null
  },
  actor: TUser
) => {
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
    new Set(
      [...admins.map(v => v.email), bill.user?.email ?? null, bill.author?.email ?? null].filter(
        Boolean
      )
    )
  ) as string[]

  if (!recipients.length) return

  const statusLabel = BillStatusLabel[bill.status as keyof typeof BillStatusLabel] || bill.status
  const amount = Number(bill.amount || 0).toFixed(2)
  const subject = `Conveyance Bill #${bill.id} is now ${statusLabel}`
  const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #111827;">
      <h2 style="margin: 0 0 10px;">Conveyance Bill Status Updated</h2>
      <p style="margin: 0 0 12px;">
        Bill <b>#${bill.id}</b> has been marked as <b>${statusLabel}</b> by <b>${actor.name || 'System'}</b>.
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

export const changeBillStatus = async (
  event: H3Event,
  options?: { billId?: number; input?: TZChangeBillStatus }
) => {
  const user = await getCurrentUser(event)
  const input = options?.input ?? (await validate(await readBody(event), zChangeBillStatus))
  const billId = options?.billId ?? getRouterParamId(event)

  const bill = await prisma.bill.findUnique({
    where: {
      id: billId
    },
    select: {
      id: true,
      date: true,
      amount: true,
      status: true,
      purpose: true,
      authorId: true,
      user: {
        select: {
          name: true,
          email: true
        }
      },
      author: {
        select: {
          name: true,
          email: true
        }
      },
      type: {
        select: {
          name: true
        }
      }
    }
  })
  if (!bill) throw err.notFound()

  const transition = applyBillTransition({
    status: bill.status,
    event: input.action,
    isAdmin: !!user.updateAnyBills,
    isAuthor: bill.authorId === user.id
  })
  if (!transition.ok) {
    throw err.unprocessable({
      status: {
        errors: [`Cannot ${input.action} a bill in ${bill.status} status`]
      }
    })
  }

  const data = getStatusUpdateData(input.action, user.id)
  const updated = (await prisma.bill.update({
    where: {
      id: bill.id
    },
    data,
    ...selectBill({ user })
  })) as any

  await notifyBillStatusChange(
    {
      ...bill,
      status: updated.status
    },
    user
  )

  return {
    message: getBillTransitionMessage(input.action),
    data: {
      ...updated,
      workflow: getBillWorkflow({
        status: updated.status,
        isAdmin: !!user.updateAnyBills,
        isAuthor: updated.author?.id === user.id
      })
    }
  }
}
