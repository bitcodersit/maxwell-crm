import { updateProperty, zPropertyIdParam, zUpdateProperty } from '~~/server/utils/properties'

export default defineEventHandler(async event => {
  await getCurrentUser(event)
  const params = await validate({ id: getRouterParam(event, 'id') }, zPropertyIdParam)
  const body = await readBody(event)
  const input = await validate(body, zUpdateProperty)
  return updateProperty(params.id, input)
})
