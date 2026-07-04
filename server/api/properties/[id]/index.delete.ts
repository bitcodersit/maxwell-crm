import {
  assertCanDeleteProperty,
  deleteProperties,
  zPropertyIdsParam
} from '~~/server/utils/properties'

export default defineEventHandler(async event => {
  const user = await getCurrentUser(event)
  assertCanDeleteProperty(user)
  const params = await validate({ id: getRouterParam(event, 'id') }, zPropertyIdsParam)
  const ids = params.id
  return deleteProperties(ids)
})
