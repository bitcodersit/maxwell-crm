import type { Comment, Commentable } from '~~/prisma/client/client'

export type TComment = Comment & {
  author?: TMaybe<Pick<TUser, 'id' | 'name' | 'avatar'>>
  attachable?: TMaybe<TAttachable>
}

export type TCommentable = Commentable & {
  comments?: TMaybe<TComment[]>
}
