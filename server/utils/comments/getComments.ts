import type { H3Event } from 'h3'
import { z } from 'zod'
import { selectComment } from './select'
import { getScopedComment } from './utils'

export type TZGetComments = z.infer<typeof zGetComments>
export const zGetComments = z
  .object({
    authorId: zId().nullish(),
    orderBy: zOrderByRecord(['createdAt'])
      .default([
        {
          createdAt: 'desc'
        }
      ])
      .nullish()
  })
  .and(zPagination())
  .and(zGetCommentable)

export const getComments = async (event: H3Event, options?: { input?: TZGetComments }) => {
  const user = await getCurrentUser(event)
  const input = await getInput(event, zGetComments, options)
  const commentableId = await getCommentableId(event, { input })

  const where = getWhere2<Prisma.CommentWhereInput, TZGetComments>(input)
    .id('authorId')
    .extend({
      deletedAt: null,
      commentableId
    })
    .scope(v => getScopedComment(v, user))
    .get()

  const { take, skip, paginate } = getPagination(input)
  const [total, comments] = await prisma.$transaction([
    prisma.comment.count({ where }),
    prisma.comment.findMany({
      take,
      skip,
      where,
      orderBy: input.orderBy,
      ...selectComment()
    })
  ])

  return paginate(comments, total)
}
