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
