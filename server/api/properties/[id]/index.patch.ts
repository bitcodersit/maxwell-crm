import {
  assertCanUpdateProperty,
  updateProperty,
  zPropertyIdParam,
  zUpdateProperty
} from '~~/server/utils/properties'

export default defineEventHandler(async event => {
  const user = await getCurrentUser(event)
  assertCanUpdateProperty(user)
  const params = await validate({ id: getRouterParam(event, 'id') }, zPropertyIdParam)
  const body = await readBody(event)
  const input = await validate(body, zUpdateProperty)
  return updateProperty(params.id, input, user)
})
