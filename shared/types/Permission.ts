import type { Permission } from '~~/prisma/client/client'
import type { TRolePermission } from './RolePermission'

export type TPermission = Permission &
  Partial<{
    rolePermissions: TRolePermission[]
  }>
