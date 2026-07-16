export default defineEventHandler(async event => {
  const id = getRouterParamId(event)
  return markNotificationRead(event, id)
})
