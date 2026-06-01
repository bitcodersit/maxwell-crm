export const getScopedTeam: TScopeFn<Prisma.TeamWhereInput> = (where, user) => {
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
