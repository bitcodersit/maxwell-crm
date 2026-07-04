import type { TSelectParams } from '../types'

export const selectUserAvatar = {
  select: {
    path: true
  }
}

export const selectUserBase = {
  id: true,
  name: true,
  email: true,
  phone: true,
  avatar: selectUserAvatar
}

export const selectUserVerifiedAt = {
  emailVerifiedAt: true,
  phoneVerifiedAt: true
}

export const selectUserForDisplay = {
  select: selectUserBase
}

export const selectUserForTeamMember = {
  select: {
    ...selectUserBase,
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
}

export const selectUserForBadge = {
  select: {
    id: true,
    name: true,
    avatar: selectUserAvatar
  }
}

export const selectUserForOptions = {
  select: {
    id: true,
    name: true
  }
}

export const selectUserForEmail = {
  select: {
    name: true,
    email: true
  }
}

export const selectUserForSession = {
  select: {
    id: true,
    name: true,
    email: true,
    avatar: selectUserAvatar
  }
}

const selectUserForTable = (user?: TUser) => ({
  select: user?.readAnyUsers
    ? {
        ...selectUserBase,
        ...selectTimestamp,
        ...selectUserVerifiedAt,
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
    : selectUserBase
})

export const selectUser = ({ user, options }: TSelectParams) => {
  return options ? selectUserForOptions : selectUserForTable(user)
}
