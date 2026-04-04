import type { UserRole } from '~~/prisma/client/client'
import type { TRole } from './Role'
import type { TUser } from './User'

export type TUserRole = UserRole &
  Partial<{
    role: TRole
    user: TUser
  }>
