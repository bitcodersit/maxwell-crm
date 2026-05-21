export default defineEventHandler(async event => {
  const query = getQuery(event)
  const input = await validate(query, zGetTeams)

  const user = await getCurrentUser(event)
  if (!user.readAnyTeams || !user.readOwnTeams) {
    return err.denied()
  }

  return await getTeams(input, user)
})
