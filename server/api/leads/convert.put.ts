import { convertLead, zConvertLead } from '~~/server/utils/leads'

export default defineEventHandler(async event => {
  const user = await getCurrentUser(event)
  if (!user.updateAnyLeads && !user.updateOwnLeads) throw err.denied()

  const body = await readBody(event)
  const input = await validate(body, zConvertLead)

  return convertLead(input, user)
})
