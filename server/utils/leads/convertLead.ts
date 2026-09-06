import { z } from 'zod'
import { getLeadScopedWhere } from './getLeadScopedWhere'
import { selectLeadForDisplay } from './select'

export type TZConvertLead = z.infer<typeof zConvertLead>
export const zConvertLead = z.object({
  leadId: zId(),
  columnId: zId()
})

export const convertLead = async (input: TZConvertLead, user: TUser) => {
  const where = getLeadScopedWhere(user, {
    id: input.leadId,
    deletedAt: null
  })

  const lead = await prisma.lead.findFirst({
    where,
    include: selectLeadForDisplay
  })

  if (!lead) throw err.notFound()

  if (lead.boardItems?.length) {
    throw err.unprocessable({
      leadId: { errors: ['This lead is already converted to a deal'] }
    })
  }

  const boardItem = await assignLeadToTheBoard(lead.id, input.columnId)
  if (!boardItem) {
    throw err.unprocessable({
      columnId: { errors: ['Selected column was not found on the default board'] }
    })
  }

  return {
    ...lead,
    boardItems: [boardItem]
  }
}
