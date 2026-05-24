import type { H3Event } from 'h3'
import { z } from 'zod'

export type TZGetFollowUp = z.infer<typeof zGetFollowUp>
export const zGetFollowUp = z.object({
  id: zId().nullish()
})

export const getFollowUp = async (event: H3Event, options?: { input?: TZGetFollowUp }) => {
  const user = await getCurrentUser(event)
  const input = await getInput(event, zGetFollowUp, options)

  const where = getWhere2<Prisma.FollowUpWhereInput, TZGetFollowUp>(input)
    .id('id')
    .extend({ deletedAt: null })
    .scope(v => getScopedFollowUp(v, user))
    .get()

  const data = await prisma.followUp.findFirst({
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
