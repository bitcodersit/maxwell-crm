import type { H3Event } from 'h3'
import z from 'zod'
import { zString } from '../zod'
import { selectLead } from './select'
import { getScopedLead } from './utils'

export type TZGetLead = z.infer<typeof zGetLead>
export const zGetLead = z.object({
  id: zId().nullish(),
  sid: zString().nullish()
})

export const getLead = async (event: H3Event, options?: { input?: TZGetLead }) => {
  const user = await getCurrentUser(event)
  if (!user.readAnyLeads && !user.readOwnLeads) {
    return err.denied()
  }

  const input = options?.input ?? (await validate(getQuery(event), zGetLead))
  const where = getWhere2<Prisma.LeadWhereInput, TZGetLead>(input)
    .id('id')
    .text('sid')
    .extend({ deletedAt: null })
    .scope(v => getScopedLead(v, user))
    .get()

  const data = await prisma.lead.findFirst({
    where,
    ...selectLead({
      user
    })
  })

  if (!data) throw err.notFound()
  return data
}
