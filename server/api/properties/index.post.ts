import {
  assertCanCreateProperty,
  assertCanDeleteProperty,
  assertCanReadProperties,
  assertCanUpdateProperty,
  createProperty,
  zCreateProperty
} from '~~/server/utils/properties'

export default defineEventHandler(async event => {
  const user = await getCurrentUser(event)
  assertCanCreateProperty(user)
  const body = await readBody(event)
  const input = await validate(body, zCreateProperty)
  return createProperty(input, user)
})
