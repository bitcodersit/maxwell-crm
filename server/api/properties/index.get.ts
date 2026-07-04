import {
  assertCanReadProperties,
  getProperties,
  zGetProperties
} from '~~/server/utils/properties'

export default defineEventHandler(async event => {
  const user = await getCurrentUser(event)
  assertCanReadProperties(user)
  const query = getQuery(event)
  const input = await validate(query, zGetProperties)
  return getProperties(input)
})
