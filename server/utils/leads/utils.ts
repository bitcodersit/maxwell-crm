export const getScopedLead: TScopeFn<Prisma.LeadWhereInput> = (where, user) => {
  if (user.readAnyLeads) return where
  return {
    AND: [
      where,
      {
        OR: [
          {
            creatorId: user.id
          },
          {
            assignable: {
              assignedUsers: {
                some: {
                  userId: user.id
                }
              }
            }
          },
          {
            assignable: {
              assignedTeams: {
                some: {
                  team: {
                    members: {
                      some: {
                        userId: user.id
                      }
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
