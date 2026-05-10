import type { TMaybe } from '.'
import type { TUserRole } from './UserRole'
import type { Attachment, User } from '~~/prisma/client/client'

export type TUser = User & {
  avatar?: TMaybe<Attachment>
  creator?: TMaybe<Pick<User, 'id' | 'name'>>
  userRoles?: TUserRole[]
}
