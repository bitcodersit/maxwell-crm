export default defineEventHandler(async event => {
  await getCurrentUser(event)
  const query = getQuery(event)
  const input = await validate(query, zFindBoardQuery)
  const { data, error } = await findBoard(input)
  if (error) throw error
  return data
})
