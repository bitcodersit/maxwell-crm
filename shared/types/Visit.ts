import type { Visit } from '~~/prisma/client/client'

export type TVisit = Visit & {
  author?: TMaybe<Pick<TUser, 'id' | 'name' | 'avatar'>>
  assignable?: TMaybe<TAssignable>
  attachable?: TMaybe<TAttachable>
  commentable?: TMaybe<TCommentable>
}
