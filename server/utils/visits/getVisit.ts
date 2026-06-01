import type { H3Event } from 'h3'
import { z } from 'zod'

export type TZGetVisit = z.infer<typeof zGetVisit>
export const zGetVisit = z.object({
  id: zId().nullish()
})

export const getVisit = async (event: H3Event, options?: { input?: TZGetVisit }) => {
  const user = await getCurrentUser(event)
  const input = await getInput(event, zGetVisit, options)

  const where = getWhere2<Prisma.VisitWhereInput, TZGetVisit>(input)
    .id('id')
    .extend({ deletedAt: null })
    .scope(v => getScopedVisit(v, user))
    .get()

  const data = await prisma.visit.findFirst({
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
