import type { TSelectParams } from '../types'
import { selectUserForDisplay } from '../users'

export const selectBillForOptions = {
  select: {
    id: true,
    purpose: true,
    amount: true
  }
}

export const selectBillForTable = {
  select: {
    id: true,
    date: true,
    amount: true,
    status: true,
    purpose: true,
    reviewedAt: true,
    createdAt: true,
    updatedAt: true,
    user: selectUserForDisplay,
    author: selectUserForDisplay,
    reviewer: selectUserForDisplay,
    type: {
      select: {
        id: true,
        name: true
      }
    }
  }
}

export const selectBill = ({ options }: TSelectParams) => {
  return options ? selectBillForOptions : selectBillForTable
}
