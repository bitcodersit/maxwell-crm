import type { User } from '~~/prisma/client/client'
import type { TUserRole } from './UserRole'

export type TUser = User &
  Partial<{
    userRoles: TUserRole[]
  }>
