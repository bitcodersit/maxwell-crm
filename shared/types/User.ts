import type { Attachment, User } from '~~/prisma/client/client'
import type { TUserRole } from './UserRole'
import type { TMaybe } from '.'

export type TUser = User & {
  avatar?: TMaybe<Attachment>
  userRoles?: TUserRole[]
}
