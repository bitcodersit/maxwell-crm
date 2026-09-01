const zConvertLead = z.object({
  leadId: z.number().int().positive()
})

export default defineEventHandler(async event => {
  // Check permission
  const user = await getCurrentUser(event)
  if (!user.updateAnyLeads && !user.updateOwnLeads) throw err.denied()

  // Parse and validate input
  const body = await readBody(event)
  const input = await validate(body, zConvertLead)

  // TODO: Boilerplate only. Conversion is not implemented yet — this
  // intentionally performs no work and simply echoes the received payload.
  return {
    success: true,
    leadId: input.leadId
  }
})
