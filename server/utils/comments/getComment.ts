import type { H3Event } from 'h3'
import { z } from 'zod'

export type TZGetComment = z.infer<typeof zGetComment>
export const zGetComment = z.object({
  id: zId().nullish()
})

export const getComment = async (event: H3Event, options?: { input?: TZGetComment }) => {
  const user = await getCurrentUser(event)
  const input = await getInput(event, zGetComment, options)

  const where = getWhere2<Prisma.CommentWhereInput, TZGetComment>(input)
    .id('id')
    .extend({ deletedAt: null })
    .scope(v => getScopedComment(v, user))
    .get()

  const data = await prisma.comment.findFirst({
    where,
    include: {
      attachable: {
        include: {
          attachments: {
            where: {
              deletedAt: null
            }
          }
        }
      }
    }
  })

  if (!data) throw err.notFound()
  return data
}
