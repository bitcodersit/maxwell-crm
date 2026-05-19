import { createLead, zCreateLead } from '~~/server/utils/leads'

export default defineEventHandler(async event => {
  // Check permission
  const user = await getCurrentUser(event, { cache: false })
  if (!user.createAnyLeads) return err.denied()

  // Parse and validate input
  const body = await readBody(event)
  const input = await validate(body, zCreateLead)

  // Create lead
  return await createLead(input, user)
})
