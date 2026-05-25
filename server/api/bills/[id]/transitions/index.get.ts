import { getBillTransitions, zGetBillTransitions } from '~~/server/utils/bills/getBillTransitions'

export default defineEventHandler(async event => {
  const id = getRouterParamId(event)

  const query = getQuery(event)
  query.id = id

  const input = await validate(query, zGetBillTransitions)

  return getBillTransitions(event, { input })
})
