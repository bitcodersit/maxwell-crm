import { createTransport } from 'nodemailer'
import { createSingleton } from './singleton'

export const mailer = createSingleton('mailer', () => {
  return createTransport({
    host: process.env.NUXT_MAIL_HOST,
    port: Number(process.env.NUXT_MAIL_PORT),
    from: `"${process.env.NUXT_MAIL_FROM_NAME}" <${process.env.NUXT_MAIL_FROM}>`,
    auth: {
      user: process.env.NUXT_MAIL_USER,
      pass: process.env.NUXT_MAIL_PASS
    }
  })
})
