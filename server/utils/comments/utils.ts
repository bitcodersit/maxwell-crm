export const getScopedComment: TScopeFn<Prisma.CommentWhereInput> = (where, user) => {
  if (user.readAnyComments) return where
  return {
    AND: [
      where,
      {
        authorId: user.id
      }
    ]
  }
}
