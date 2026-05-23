export const getAssignableUpdate = (
  input: {
    userIds?: TMaybe<number[]>
    teamIds?: TMaybe<number[]>
  },
  user: TUser
) => {
  return {
    update: {
      users: input.userIds?.length
        ? {
            deleteMany: {
              userId: {
                notIn: input.userIds
              }
            },
            createMany: {
              skipDuplicates: true,
              data: input.userIds.map(userId => ({
                userId,
                assignerId: user.id
              }))
            }
          }
        : undefined,
      teams: input.teamIds?.length
        ? {
            deleteMany: {
              teamId: {
                notIn: input.teamIds
              }
            },
            createMany: {
              skipDuplicates: true,
              data: input.teamIds.map(teamId => ({
                teamId,
                assignerId: user.id
              }))
            }
          }
        : undefined
    }
  }
}
