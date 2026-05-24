import { createStateMachine } from '../workflow/createStateMachine'
import { BillStatuses, BillStatusLabel, type TBillStatus } from './status'

export const BillEvents = ['submit', 'approve', 'reject', 'cancel'] as const
export type TBillEvent = (typeof BillEvents)[number]

type TBillWorkflowContext = {
  isAdmin: boolean
  isAuthor: boolean
}

const billStateMachine = createStateMachine<TBillStatus, TBillEvent, TBillWorkflowContext>({
  transitions: {
    New: {
      submit: {
        to: 'Pending',
        can: ({ isAdmin, isAuthor }) => isAdmin || isAuthor
      }
    },
    Rejected: {
      submit: {
        to: 'Pending',
        can: ({ isAdmin, isAuthor }) => isAdmin || isAuthor
      }
    },
    Pending: {
      approve: {
        to: 'Approved',
        can: ({ isAdmin }) => isAdmin
      },
      reject: {
        to: 'Rejected',
        can: ({ isAdmin }) => isAdmin
      },
      cancel: {
        to: 'Cancelled',
        can: ({ isAdmin, isAuthor }) => isAdmin || isAuthor
      }
    }
  }
})

const toBillStatus = (status: unknown): TBillStatus => {
  const current = String(status || '')
  if ((BillStatuses as readonly string[]).includes(current)) return current as TBillStatus
  return 'New'
}

const getContext = (input: { isAdmin: boolean; isAuthor: boolean }) => {
  return {
    isAdmin: !!input.isAdmin,
    isAuthor: !!input.isAuthor
  }
}

export const getBillWorkflow = (input: {
  status: unknown
  isAdmin: boolean
  isAuthor: boolean
}) => {
  const status = toBillStatus(input.status)
  const context = getContext(input)
  const availableTransitions = billStateMachine.getAvailableTransitions(status, context)

  return {
    status,
    label: BillStatusLabel[status],
    availableTransitions,
    availableActions: availableTransitions.map(v => v.event),
    canUpdate:
      context.isAdmin || (context.isAuthor && ['New', 'Cancelled', 'Rejected'].includes(status)),
    canDelete: context.isAdmin || (context.isAuthor && ['New', 'Cancelled'].includes(status))
  }
}

export const applyBillTransition = (input: {
  status: unknown
  event: TBillEvent
  isAdmin: boolean
  isAuthor: boolean
}) => {
  const status = toBillStatus(input.status)
  const context = getContext(input)
  return billStateMachine.apply(status, input.event, context)
}

export const getBillTransitionMessage = (event: TBillEvent) => {
  if (event === 'submit') return 'Bill submitted for review'
  if (event === 'approve') return 'Bill approved successfully'
  if (event === 'reject') return 'Bill rejected successfully'
  return 'Bill cancelled successfully'
}
