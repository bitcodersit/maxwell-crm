export const getScopedFollowUp: TScopeFn<Prisma.FollowUpWhereInput> = (where, user) => {
  if (user.readAnyFollowUps) return where
  return {
    AND: [
      where,
      {
        OR: [
          scopeIsAuthor(user),
          {
            lead: {
              OR: [{ creatorId: user.id }, ...scopeIsAssigned(user)]
            }
          }
        ]
      }
    ]
  }
}
