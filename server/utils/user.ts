import { Prisma } from '~~/prisma/client/client'

export const UserSelectForOptions = {
  id: true,
  name: true,
  avatarId: true
} satisfies Prisma.UserSelect
