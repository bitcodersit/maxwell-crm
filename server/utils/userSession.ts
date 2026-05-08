import type { TUser } from '@@/shared/types'

export function userToSession(user: TUser) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    avatarId: user.avatarId,
    roles: (user.userRoles?.map(ur => ur.role?.name).filter(Boolean) ?? []) as string[],
    permissions: (user.userRoles?.flatMap(
      ur => ur.role?.rolePermissions?.map(rp => rp.permission?.name).filter(Boolean) ?? []
    ) ?? []) as string[]
  }
}
