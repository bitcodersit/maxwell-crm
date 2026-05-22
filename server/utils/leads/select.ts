import { selectUserForDisplay, selectUserForEmail } from '../users/select'

export const selectLeadForUpdate: Prisma.LeadSelect = {
  assignable: {
    select: {
      assignedUsers: {
        select: {
          user: selectUserForEmail
        }
      },
      assignedTeams: {
        select: {
          team: {
            select: {
              members: {
                select: {
                  user: selectUserForEmail
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
  creator: selectUserForDisplay,
  customer: selectUserForDisplay,
  source: true,
  address: true,
  propertyTypeMain: true,
  propertyTypeSub: true,
  assignable: {
    include: {
      assignedUsers: {
        include: {
          user: selectUserForDisplay
        }
      },
      assignedTeams: {
        include: {
          team: {
            include: {
              members: {
                include: {
                  user: selectUserForDisplay
                }
              }
            }
          }
        }
      }
    }
  }
}
