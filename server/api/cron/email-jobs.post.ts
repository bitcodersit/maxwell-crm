export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig(event)
  const secret = config.emailCronSecret
  if (secret) {
    const received = getHeader(event, 'x-cron-secret')
    if (received !== secret) {
      throw err.denied()
    }
  }

  return dispatchPendingEmails(50)
})
