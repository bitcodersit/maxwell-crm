import { BillApprovalStage } from '~~/prisma/client/enums'
import { createTransitions } from '../transitions'

export const BillTransitions = [
  'submit',
  'cancel',
  'reinitialize',
  'approveLeader',
  'revokeLeader',
  'approveAccountant',
  'approveAdmin',
  'reject',
  'rejectAny'
] as const
export type TBillTransition = (typeof BillTransitions)[number]

type TContext = {
  bill: TBill
  user: TUser
  reviewedAt?: Date | null
  approvalStage?: BillApprovalStage | null
  clearApprovals?: boolean
  removeOwnLeaderApproval?: boolean
  employeeHasTeam?: boolean
  hasLeaderApproval?: boolean
  hasOwnLeaderApproval?: boolean
  leadsEmployeeTeam?: boolean
}

const isOwnBill = (v?: Partial<TContext>) => {
  return v?.bill?.userId === v?.user?.id || v?.bill?.authorId === v?.user?.id
}

const atLeaderStage = (v?: Partial<TContext>) => {
  return !!v?.employeeHasTeam && !v?.hasLeaderApproval
}

const atAccountantStage = (v?: Partial<TContext>) => {
  return !v?.employeeHasTeam || !!v?.hasLeaderApproval
}

const notifyBillStatusChange = async (payload: TContext, transition: TBillTransition) => {
  const { bill, user } = payload
  let recipients: string[] = []

  if (transition === 'submit') {
    recipients = payload.employeeHasTeam
      ? await getTeamLeaderEmails(bill.userId)
      : await getUsersWithPermissionEmails('update-any-bills')
  } else if (transition === 'approveLeader') {
    recipients = await getUsersWithPermissionEmails('update-any-bills')
  } else if (transition === 'revokeLeader') {
    recipients = await getUsersWithPermissionEmails('update-any-bills')
  } else if (
    ['approveAccountant', 'approveAdmin', 'reject', 'rejectAny', 'cancel', 'reinitialize'].includes(
      transition
    )
  ) {
    recipients = [bill.user?.email, bill.author?.email].filter(Boolean) as string[]
  }

  recipients = Array.from(new Set(recipients.filter(Boolean)))
  if (!recipients.length) return

  const amount = Number(bill.amount || 0).toFixed(2)
  const subject =
    transition === 'revokeLeader'
      ? `Conveyance Bill #${bill.id} is awaiting team leader approval again`
      : `Conveyance Bill #${bill.id} is now ${bill.status}`
  const statusLabel = transition === 'revokeLeader' ? 'Pending (leader approval withdrawn)' : bill.status
  const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #111827;">
      <h2 style="margin: 0 0 10px;">Conveyance Bill Status Updated</h2>
      <p style="margin: 0 0 12px;">
        Bill <b>#${bill.id}</b> has been marked as <b>${statusLabel}</b> by <b>${user.name || 'System'}</b>.
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
        description: 'Submit the bill for review. You will be notified when the bill is reviewed.'
      },
      hidden: v => {
        return !(v?.user?.updateOwnBills && isOwnBill(v))
      },
      payload: () => {
        return {
          reviewedAt: null
        }
      }
    },
    {
      name: 'approveLeader',
      from: BillStatus.Pending,
      to: BillStatus.Pending,
      meta: {
        title: 'Approve',
        color: 'primary',
        description: 'Send the bill to the accountant for final approval.'
      },
      hidden: v => {
        if (v?.user?.approveAnyBills) return true
        return !(v?.user?.updateTeamBills && v?.leadsEmployeeTeam && atLeaderStage(v))
      },
      payload: () => {
        return {
          reviewedAt: new Date(),
          approvalStage: BillApprovalStage.Leader
        }
      }
    },
    {
      name: 'revokeLeader',
      from: BillStatus.Pending,
      to: BillStatus.Pending,
      meta: {
        title: 'Cancel',
        color: 'error',
        description: 'Remove your approval. The bill will go back to team leader review.'
      },
      hidden: v => {
        return !v?.hasOwnLeaderApproval
      },
      payload: () => {
        return {
          reviewedAt: null,
          removeOwnLeaderApproval: true
        }
      }
    },
    {
      name: 'approveAccountant',
      from: BillStatus.Pending,
      to: BillStatus.Approved,
      meta: {
        title: 'Approve',
        color: 'success',
        description: 'Bill will be marked as approved and the employee will be notified.'
      },
      hidden: v => {
        if (v?.user?.approveAnyBills) return true
        return !(v?.user?.updateAnyBills && atAccountantStage(v))
      },
      payload: () => {
        return {
          reviewedAt: new Date(),
          approvalStage: BillApprovalStage.Accountant
        }
      }
    },
    {
      name: 'approveAdmin',
      from: [BillStatus.New, BillStatus.Pending],
      to: BillStatus.Approved,
      meta: {
        title: 'Approve',
        color: 'success',
        description: 'Approve this bill immediately, skipping remaining review steps.'
      },
      hidden: v => {
        return !v?.user?.approveAnyBills
      },
      payload: () => {
        return {
          reviewedAt: new Date(),
          approvalStage: BillApprovalStage.Admin
        }
      }
    },
    {
      name: 'reject',
      from: BillStatus.Pending,
      to: BillStatus.Rejected,
      meta: {
        title: 'Reject',
        color: 'error',
        description: 'Bill will be marked as rejected and the employee will be notified.'
      },
      hidden: v => {
        if (v?.user?.rejectAnyBills) return true
        const leaderCan = !!v?.user?.updateTeamBills && !!v?.leadsEmployeeTeam && atLeaderStage(v)
        const accountantCan = !!v?.user?.updateAnyBills && atAccountantStage(v)
        return !(leaderCan || accountantCan)
      },
      payload: () => {
        return {
          reviewedAt: new Date(),
          approvalStage: BillApprovalStage.Reject
        }
      }
    },
    {
      name: 'rejectAny',
      from: [BillStatus.New, BillStatus.Pending],
      to: BillStatus.Rejected,
      meta: {
        title: 'Reject',
        color: 'error',
        description: 'Reject this bill immediately, skipping remaining review steps.'
      },
      hidden: v => {
        return !v?.user?.rejectAnyBills
      },
      payload: () => {
        return {
          reviewedAt: new Date(),
          approvalStage: BillApprovalStage.Reject
        }
      }
    },
    {
      name: 'cancel',
      from: [BillStatus.New, BillStatus.Pending],
      to: BillStatus.Cancelled,
      meta: {
        title: 'Cancel the bill',
        color: 'error',
        description: 'Bill will be marked as cancelled.'
      },
      hidden: v => {
        if (!isOwnBill(v)) return true
        return !(
          v?.user?.updateOwnBills ||
          v?.user?.updateTeamBills ||
          v?.user?.updateAnyBills
        )
      }
    },
    {
      name: 'reinitialize',
      from: [BillStatus.Cancelled, BillStatus.Approved, BillStatus.Rejected],
      to: BillStatus.New,
      meta: {
        title: 'Re-initialize the bill',
        color: 'primary',
        description: 'Reset this bill to New so it can be submitted again.'
      },
      hidden: v => {
        if (v?.user?.updateAnyBills) return false
        return !(
          v?.bill?.status === BillStatus.Cancelled &&
          v?.user?.updateOwnBills &&
          isOwnBill(v)
        )
      },
      payload: () => {
        return {
          reviewedAt: null,
          clearApprovals: true
        }
      }
    }
  ],
  onCheck({ payload }) {
    if (!payload) return false
    return !!(
      payload.user.updateAnyBills ||
      payload.user.approveAnyBills ||
      payload.user.rejectAnyBills ||
      payload.user.updateTeamBills ||
      payload.bill.userId === payload.user.id ||
      payload.bill.authorId === payload.user.id
    )
  },
  async onMutate({ state, payload }): Promise<TBill> {
    if (!payload) throw new Error('Payload is required')
    const data: Prisma.BillUncheckedUpdateInput = {
      status: state
    }
    if (payload.reviewedAt !== undefined) {
      data.reviewedAt = payload.reviewedAt
    }

    return prisma.$transaction(async tx => {
      const bill = await tx.bill.update({
        where: { id: payload.bill.id },
        data
      })
      if (payload.clearApprovals) {
        await tx.billApproval.deleteMany({
          where: {
            billId: payload.bill.id
          }
        })
      } else if (payload.removeOwnLeaderApproval) {
        await tx.billApproval.deleteMany({
          where: {
            billId: payload.bill.id,
            userId: payload.user.id,
            stage: BillApprovalStage.Leader
          }
        })
      } else if (payload.approvalStage) {
        await tx.billApproval.create({
          data: {
            billId: payload.bill.id,
            userId: payload.user.id,
            stage: payload.approvalStage
          }
        })
      }
      return bill
    })
  },
  onSuccess(context) {
    if (!context.payload) throw new Error('Payload is required')
    notifyBillStatusChange(
      {
        ...context.payload,
        bill: {
          ...context.payload.bill,
          status: context.state
        }
      },
      context.transition
    )
  },
  onError(context) {
    console.log('onError', context)
  }
})
