import type { TUser } from '@@/shared/types'
import { capitalize } from 'vue'

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
    ) ?? []) as string[],
    can: (
      user.userRoles?.flatMap(
        ur => ur.role?.rolePermissions?.map(rp => rp.permission?.name).filter(Boolean) ?? []
      ) ?? []
    ).reduce(
      (acc, permission) => {
        const [operation, subject, module] = (permission as string).split('-')
        if (operation && subject && module) {
          ;(acc as any)[`${operation}${capitalize(subject)}${capitalize(module)}`] = true
        }
        return acc
      },
      {} as TUser['can']
    )
  }
}
