declare module '#auth-utils' {
  interface User extends Pick<TUser, 'id' | 'name' | 'email'> {
    avatar: TMaybe<Pick<TUser['avatar'], 'path'>>
  }

  interface UserSession {
    // Add your own fields
  }

  interface SecureSessionData {
    // Add your own fields
  }
}

export {}
