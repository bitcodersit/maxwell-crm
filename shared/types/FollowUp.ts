import type { FollowUp } from '~~/prisma/client/client'

export type TFollowUp = FollowUp & {
  author?: TMaybe<Pick<TUser, 'id' | 'name' | 'avatar'>>
  attachable?: TMaybe<TAttachable>
  commentable?: TMaybe<TCommentable>
}
