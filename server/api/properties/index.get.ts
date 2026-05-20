export default defineEventHandler(async event => {
  await getCurrentUser(event)
  const query = getQuery(event)
  return queryProperties(query)
})
