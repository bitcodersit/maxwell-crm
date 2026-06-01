export default defineEventHandler(async event => {
  // Check permission
  const user = await getCurrentUser(event)
  if (!user.createAnyLeads) return err.denied()

  // Parse and validate input
  const body = await readBody(event)
  const input = await validate(body, zCreateLead)

  // Create lead
  return await createLead(input, user)
})
