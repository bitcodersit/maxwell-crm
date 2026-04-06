import type Mail from 'nodemailer/lib/mailer'
import { mailer } from './mailer'

export const sendMail = (options: Mail.Options) => {
  return mailer.sendMail({
    from: `"${process.env.NUXT_MAIL_FROM_NAME}" <${process.env.NUXT_MAIL_FROM}>`,
    ...options,
  })
}
