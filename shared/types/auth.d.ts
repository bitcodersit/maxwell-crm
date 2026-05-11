declare module '#auth-utils' {
  interface User extends Pick<
    TUser,
    'id' | 'name' | 'email' | 'phone' | 'avatarId' | 'roles' | 'permissions' | 'can'
  > {}

  interface UserSession {
    // Add your own fields
  }

  interface SecureSessionData {
    // Add your own fields
  }
}

export {}
