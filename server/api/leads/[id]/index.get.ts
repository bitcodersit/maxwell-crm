export default defineEventHandler(async event => {
  const query = getQuery(event)
  const input = await validate(query, zGetLead)

  const id = getRouterParamId(event, 'id', { validate: false })
  const sid = getRouterParam(event, 'id')

  if (!id && !sid) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Bad Request',
      message: 'Either id or sid is required'
    })
  }

  if (id) input.id = id
  else input.sid = sid

  return await getLead(event, { input })
})
