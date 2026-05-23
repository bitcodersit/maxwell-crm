export const scopeIsAssigned = (user: TUser) => {
  return [
    {
      assignable: {
        users: {
          some: {
            userId: user.id
          }
        }
      }
    },
    {
      assignable: {
        teams: {
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
