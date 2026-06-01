export default defineEventHandler(async event => {
  const query = getQuery(event)
  const input = await validate(query, zGetComment)

  const id = getRouterParamId(event)
  input.id = id

  return getComment(event, { input })
})
