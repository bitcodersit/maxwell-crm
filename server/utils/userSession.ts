import type { User } from '#auth-utils'

export function userToSession(user: User): User {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    avatar: {
      path: user.avatar?.path
    }
  }
}
