import type { Role } from '@@/prisma/client/client'
import type { TRolePermission } from './RolePermission'
import type { TUserRole } from './UserRole'

export type TRole = Role &
  Partial<{
    rolePermissions: TRolePermission[]
    userRoles: TUserRole[]
  }>
