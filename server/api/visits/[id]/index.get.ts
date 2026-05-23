export default defineEventHandler(async event => {
  const query = getQuery(event)
  const input = await validate(query, zGetVisit)

  const id = getRouterParamId(event)
  input.id = id

  return getVisit(event, { input })
})
