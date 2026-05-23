export const scopeIsAuthor = (user: TUser) => {
  return {
    authorId: user.id
  }
}
