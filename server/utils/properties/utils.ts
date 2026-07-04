export const canReadProperties = (user: TUser) =>
  !!(user.readAnyProperties || user.readOwnProperties)

export const canCreateProperty = (user: TUser) =>
  !!(user.createAnyProperties || user.createOwnProperties)

export const canUpdateProperty = (user: TUser) =>
  !!(user.updateAnyProperties || user.updateOwnProperties)

export const canDeleteProperty = (user: TUser) =>
  !!(user.deleteAnyProperties || user.deleteOwnProperties)

export const assertCanReadProperties = (user: TUser) => {
  if (!canReadProperties(user) && !user.isSuperAdmin) throw err.denied()
}

export const assertCanCreateProperty = (user: TUser) => {
  if (!canCreateProperty(user) && !user.isSuperAdmin) throw err.denied()
}

export const assertCanUpdateProperty = (user: TUser) => {
  if (!canUpdateProperty(user) && !user.isSuperAdmin) throw err.denied()
}

export const assertCanDeleteProperty = (user: TUser) => {
  if (!canDeleteProperty(user) && !user.isSuperAdmin) throw err.denied()
}
