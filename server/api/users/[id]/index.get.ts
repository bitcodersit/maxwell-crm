export default defineEventHandler(async event => {
  const query = getQuery(event)
  const input = await validate(query, zGetUser)

  const id = getRouterParamId(event)
  input.id = id

  return getUser(event, { input })
})
