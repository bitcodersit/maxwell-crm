export default defineEventHandler(async event => {
  const query = getQuery(event)
  const input = await validate(query, zGetBill)

  const id = getRouterParamId(event)
  input.id = id

  return getBill(event, { input })
})
