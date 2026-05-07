import { defineCronHandler } from '#nuxt/cron'

export default defineCronHandler('everyMinute', async () => {
  await dispatchPendingEmails(50)
})
