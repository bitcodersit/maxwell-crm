import { selectUserForDisplay, selectUserForEmail } from '../users/select'

export const selectLeadForUpdate = {
  assignable: {
    select: {
      users: {
        select: {
          user: selectUserForEmail
        }
      },
      teams: {
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
      users: {
        include: {
          user: selectUserForDisplay
        }
      },
      teams: {
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
