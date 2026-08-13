export default defineEventHandler(event => {
  return markAllNotificationsRead(event)
})
