import { getRouterParamId } from '~~/server/utils/getRouterParamId'
import { updateLead, zUpdateLead } from '~~/server/utils/leads'

export default defineEventHandler(async event => {
  // Check permission
  const user = await getCurrentUser(event, { cache: false })
  if (!user.updateAnyLeads || !user.updateOwnLeads) return err.denied()

  // Get id
  const id = getRouterParamId(event)

  // Parse and validate input
  const body = await readBody(event)
  const input = await validate(body, zUpdateLead)

  // Update lead
  return await updateLead(id, input, user)
})
