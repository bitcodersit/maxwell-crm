import { deleteProperties, zPropertyIdsParam } from '~~/server/utils/properties'

export default defineEventHandler(async event => {
  await getCurrentUser(event)
  const params = await validate({ id: getRouterParam(event, 'id') }, zPropertyIdsParam)
  const ids = params.id
  return deleteProperties(ids)
})
