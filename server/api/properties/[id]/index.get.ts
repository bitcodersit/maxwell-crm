import { getPropertyById, zPropertyIdParam } from '~~/server/utils/properties'

export default defineEventHandler(async event => {
  await getCurrentUser(event)
  const params = await validate({ id: getRouterParam(event, 'id') }, zPropertyIdParam)
  return getPropertyById(params.id)
})
