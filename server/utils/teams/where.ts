export const getTeamScopedWhere = (user: TUser, where: Prisma.TeamWhereInput) => {
  if (user.readAnyTeams) return where
  return {
    AND: [
      where,
      {
        members: {
          some: {
            userId: user.id
          }
        }
      }
    ]
  }
}
