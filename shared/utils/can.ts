import type { UserSession } from '#auth-utils'

type TModule = 'users' | 'roles' | 'permissions' | 'teams' | 'attachments'
type TOperation = 'create' | 'read' | 'update' | 'delete' | 'export'
type TSubject = 'any' | 'own'

type TPermission = `${TOperation}-${TSubject}-${TModule}`

export const can = (
  user: UserSession['user'] | null,
  permissions: TPermission | TPermission[],
  method: 'some' | 'every' = 'some'
) => {
  if (!user) return false
  if (!Array.isArray(permissions)) permissions = [permissions]
  return permissions[method]((permission) => user.permissions.includes(permission))
}
