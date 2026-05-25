import { postBillTransition, zPostBillTransition } from '~~/server/utils/bills'

export default defineEventHandler(async event => {
  const id = getRouterParamId(event)

  const body = await readBody(event)
  body.id = id

  const input = await validate(body, zPostBillTransition)

  return postBillTransition(event, { input })
})
