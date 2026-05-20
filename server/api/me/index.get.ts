export default defineEventHandler(event => {
  return getCurrentUser(event)
})
