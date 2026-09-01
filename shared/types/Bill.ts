import type { Bill, BillApproval } from '~~/prisma/client/client'
import type { BillApprovalStage, BillStatus } from '~~/prisma/client/enums'

export type TBillApproval = BillApproval & {
  user?: TMaybe<TUser>
}

export type TBill = Bill & {
  user?: TMaybe<TUser>
  author?: TMaybe<TUser>
  type?: TMaybe<TOption>
  approvals?: TBillApproval[]
  workflow?: {
    status: string
    label: string
    availableTransitions: Array<{
      event: string
      to: string
    }>
    availableActions: string[]
    canUpdate: boolean
    canDelete: boolean
  }
}

export type TBillStatus = BillStatus
export type TBillApprovalStage = BillApprovalStage
