import { getProperties, zGetProperties } from '~~/server/utils/properties'

export default defineEventHandler(async event => {
  await getCurrentUser(event)
  const query = getQuery(event)
  const input = await validate(query, zGetProperties)
  return getProperties(input)
})
