export default defineEventHandler(async event => {
  await requireUserSession(event)
  const id = getRouterParam(event, 'id')
  const { data, error } = await getBoard(id)
  if (error) throw error
  return data
})
