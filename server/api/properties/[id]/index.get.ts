import {
  assertCanReadProperties,
  getPropertyById,
  zPropertyIdParam
} from '~~/server/utils/properties'

export default defineEventHandler(async event => {
  const user = await getCurrentUser(event)
  assertCanReadProperties(user)
  const params = await validate({ id: getRouterParam(event, 'id') }, zPropertyIdParam)
  return getPropertyById(params.id)
})
