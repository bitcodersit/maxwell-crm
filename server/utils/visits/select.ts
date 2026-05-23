export const selectVisit = () => {
  return {
    select: {
      id: true,
      date: true,
      status: true,
      checkIn: true,
      nextAction: true,
      customerPresence: true,
      author: selectUserForBadge,
      attachable: {
        select: {
          attachments: selectAttachmentForCard
        }
      },
      assignable: {
        select: {
          users: {
            select: {
              user: selectUserForBadge
            }
          },
          teams: {
            select: {
              team: {
                select: {
                  members: {
                    select: {
                      user: selectUserForBadge
                    }
                  }
                }
              }
            }
          }
        }
      },
      commentable: {
        select: {
          comments: selectComment()
        }
      }
    }
  }
}
