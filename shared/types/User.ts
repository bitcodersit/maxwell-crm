import type { TMaybe } from '.'
import type { TUserRole } from './UserRole'
import type { Attachment, User } from '~~/prisma/client/client'

type TScope = 'Any' | 'Own'
type TOperation = 'create' | 'read' | 'update' | 'delete' | 'export'

type TModule =
  | 'Users'
  | 'Roles'
  | 'Teams'
  | 'Tasks'
  | 'Leads'
  | 'Properties'
  | 'Permissions'
  | 'Attachments'
  | 'Comments'
  | 'Bills'
  | 'Visits'
  | 'FollowUps'

type TRoleName = 'SuperAdmin' | 'Admin' | 'Manager' | 'Salesman' | 'Accountant' | 'Customer'

export type TUser = User & {
  avatar?: TMaybe<Attachment>
  creator?: TMaybe<Pick<User, 'id' | 'name'>>
  userRoles?: TUserRole[]
  roles?: string[]
  permissions?: string[]
} & Record<`${TOperation}${TScope}${TModule}`, TMaybe<boolean>> &
  Record<`is${TRoleName}`, boolean>
