import type { Prisma } from '~~/prisma/client/client'

export const getLeadScopedWhere = (user: TUser, where: Prisma.LeadWhereInput) => {
  if (user.readAnyLeads) return where
  return {
    AND: [
      where,
      {
        OR: [
          { creatorId: user.id },
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
  } satisfies Prisma.LeadWhereInput
}
