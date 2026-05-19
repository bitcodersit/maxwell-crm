import type { TMaybe } from '.'
import type { TUserRole } from './UserRole'
import type { Attachment, User } from '~~/prisma/client/client'

type TModule = 'Users' | 'Roles' | 'Permissions' | 'Teams' | 'Attachments' | 'Tasks' | 'Leads'
type TOperation = 'create' | 'read' | 'update' | 'delete' | 'export'
type TSubject = 'Any' | 'Own'

export type TUser = User & {
  avatar?: TMaybe<Attachment>
  creator?: TMaybe<Pick<User, 'id' | 'name'>>
  userRoles?: TUserRole[]
  roles?: string[]
  permissions?: string[]
} & Record<`${TOperation}${TSubject}${TModule}`, TMaybe<boolean>>
