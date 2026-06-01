export const getAssignableCreate = (
  input: {
    userIds?: TMaybe<number[]>
    teamIds?: TMaybe<number[]>
  },
  user: TUser
) => {
  return {
    create: {
      users: input.userIds?.length
        ? {
            create: input.userIds.map(userId => ({
              userId,
              assignerId: user.id
            }))
          }
        : undefined,
      teams: input.teamIds?.length
        ? {
            create: input.teamIds.map(teamId => ({
              teamId,
              assignerId: user.id
            }))
          }
        : undefined
    }
  }
}
