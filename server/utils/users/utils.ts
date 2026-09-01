export const canReadUsers = (user: TUser) => {
  return !!(user.readAnyUsers || user.readTeamUsers || user.readOwnUsers)
}

export const getScopedUser: TScopeFn<Prisma.UserWhereInput> = (where, user) => {
  if (user.readAnyUsers) return where

  const clauses: Prisma.UserWhereInput[] = []
  if (user.readOwnUsers) {
    clauses.push({ id: user.id }, { creatorId: user.id })
  }
  if (user.readTeamUsers) {
    clauses.push(
      { id: user.id },
      {
        teamMembers: {
          some: {
            deletedAt: null,
            team: {
              deletedAt: null,
              members: {
                some: {
                  userId: user.id,
                  deletedAt: null
                }
              }
            }
          }
        }
      }
    )
  }

  if (!clauses.length) {
    return {
      AND: [where, { id: -1 }]
    }
  }

  return {
    AND: [
      where,
      {
        OR: clauses
      }
    ]
  }
}
