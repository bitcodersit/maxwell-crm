import type { UserSession } from '#auth-utils'

type TModule = 'user' | 'role' | 'permission' | 'team' | 'team-member'
type TOperation = 'create' | 'read' | 'update' | 'delete'
type TSubject = 'any' | 'own'

type TPermission = `${TOperation}-${TSubject}-${TModule}`

export const can = (
  session: UserSession,
  permissions: TPermission | TPermission[],
  method: 'some' | 'every' = 'some'
) => {
  if (!session.user) return false
  if (!Array.isArray(permissions)) permissions = [permissions]
  const user = session.user
  return permissions[method]((permission) => user.permissions.includes(permission))
}
