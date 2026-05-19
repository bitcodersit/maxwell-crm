import { selectUserForDisplay, selectUserForEmail } from '../users/select'

export const selectLeadForUpdate: Prisma.LeadSelect = {
  assignable: {
    select: {
      assignedUsers: {
        select: {
          user: {
            select: selectUserForEmail
          }
        }
      },
      assignedTeams: {
        select: {
          team: {
            select: {
              members: {
                select: {
                  user: {
                    select: selectUserForEmail
                  }
                }
              }
            }
          }
        }
      }
    }
  }
}

export const selectLeadForDisplay: Prisma.LeadInclude = {
  creator: {
    select: selectUserForDisplay
  },
  customer: {
    select: selectUserForDisplay
  },
  source: true,
  address: true,
  propertyTypeMain: true,
  propertyTypeSub: true,
  assignable: {
    include: {
      assignedUsers: {
        include: {
          user: {
            select: selectUserForDisplay
          }
        }
      },
      assignedTeams: {
        include: {
          team: {
            include: {
              members: {
                include: {
                  user: {
                    select: selectUserForDisplay
                  }
                }
              }
            }
          }
        }
      }
    }
  }
}
