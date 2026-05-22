export const selectUserForOptions: Prisma.UserSelect = {
  id: true,
  name: true
}

export const selectUserForEmail: Prisma.UserSelect = {
  name: true,
  email: true
}

export const selectUserForDisplay: Prisma.UserSelect = {
  id: true,
  name: true,
  email: true,
  phone: true,
  avatar: {
    select: {
      path: true
    }
  }
}

export const selectUserForSession: Prisma.UserSelect = {
  id: true,
  name: true,
  email: true,
  avatar: {
    select: {
      path: true
    }
  }
}

const selectUserForTable = {
  select: {
    id: true,
    name: true,
    email: true,
    emailVerifiedAt: true,
    phone: true,
    phoneVerifiedAt: true,
    avatarId: true,
    createdAt: true,
    updatedAt: true,
    creator: {
      select: {
        id: true,
        name: true
      }
    },
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
  } satisfies Prisma.UserSelect
}

export const selectUser = (v?: { options?: boolean }) => {
  return v?.options
    ? {
        select: selectUserForOptions
      }
    : selectUserForTable
}
