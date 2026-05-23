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

export const selectLeadForDisplay = {
  creator: selectUserForDisplay,
  customer: selectUserForDisplay,
  source: true,
  address: true,
  boardItems: true,
  propertyTypeMain: true,
  propertyTypeSub: true,
  attachable: {
    select: {
      attachments: {
        select: {
          id: true,
          name: true,
          path: true
        }
      }
    }
  },
  commentable: {
    select: {
      comments: {
        select: {
          id: true,
          text: true,
          attachable: {
            select: {
              attachments: {
                select: {
                  id: true,
                  name: true,
                  path: true
                }
              }
            }
          }
        }
      }
    }
  },
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

export const selectLead = (_: TSelectParams) => {
  return {
    include: selectLeadForDisplay
  }
}
