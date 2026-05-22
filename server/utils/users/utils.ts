export const getScopedUser: TScopeFn<Prisma.UserWhereInput> = (where, user) => {
  if (user.readAnyUsers) return where
  return {
    AND: [
      where,
      {
        OR: [
          {
            creatorId: user.id
          },
          {
            teamMembers: {
              some: {
                team: {
                  deletedAt: null,
                  members: {
                    some: {
                      userId: user.id
                    }
                  }
                }
              }
            }
          }
        ]
      }
    ]
  }
}
