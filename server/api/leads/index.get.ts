export default defineEventHandler(async event => {
  await requireUserSession(event)
  const query = getQuery(event)
  return queryLeads(query)
})
