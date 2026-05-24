import { z } from 'zod'

export const BillStatuses = ['New', 'Pending', 'Approved', 'Cancelled', 'Rejected'] as const
export type TBillStatus = (typeof BillStatuses)[number]
export const zBillStatus = z.enum(BillStatuses)

export const BillStatusLabel: Record<TBillStatus, string> = {
  New: 'New',
  Pending: 'Pending Approval',
  Approved: 'Approved',
  Cancelled: 'Cancelled',
  Rejected: 'Rejected'
}
