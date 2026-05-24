export default defineEventHandler(async event => {
  const id = getRouterParamId(event)
  return changeBillStatus(event, {
    billId: id
  })
})
