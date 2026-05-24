export default defineEventHandler(async event => {
  const query = getQuery(event)
  const input = await validate(query, zGetFollowUp)

  const id = getRouterParamId(event)
  input.id = id

  return getFollowUp(event, { input })
})
