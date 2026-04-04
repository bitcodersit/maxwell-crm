import type { RolePermission } from '~~/prisma/client/client'
import type { TRole } from './Role'
import type { TPermission } from './Permission'

export type TRolePermission = RolePermission &
  Partial<{
    role: TRole
    permission: TPermission
  }>
