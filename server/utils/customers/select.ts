import type { TSelectParams } from '../types'

export const selectCustomerBase = {
  id: true,
  name: true,
  phone: true,
  avatar: selectUserAvatar,
  phoneVerifiedAt: true
}

export const selectCustomerForOptions = {
  select: {
    id: true,
    name: true,
    avatar: selectUserAvatar
  }
}

const selectCustomerForTable = (user?: TUser) => ({
  select: user?.readAnyUsers
    ? {
        ...selectCustomerBase,
        ...selectTimestamp,
        creator: selectUserForDisplay,
        userRoles: {
          select: {
            id: true,
            role: {
              select: {
                id: true,
                name: true
              }
            }
          }
        }
      }
    : selectCustomerBase
})

export const selectCustomer = ({ user, options }: TSelectParams) => {
  return options ? selectCustomerForOptions : selectCustomerForTable(user)
}
