import { render } from '@vue-email/render'
import EmailMagicLink from '@/components/emails/EmailMagicLink.vue'
import { isCustomerRoleName } from '~~/server/utils/customerRole'

const zMagic = z.object({
  email: z.email()
})

export default defineEventHandler(async event => {
  const body = await readBody(event)
  const input = await validate(body, zMagic)

  const user = await prisma.user.findUnique({
    where: {
      email: input.email
    },
    include: {
      userRoles: {
        include: {
          role: {
            select: {
              name: true
            }
          }
        }
      }
    }
  })

  if (!user) throw err.notFound()
  if (user.userRoles.some(ur => isCustomerRoleName(ur.role?.name))) {
    throw err.unauth('Customer portal is not available yet')
  }

  const token = Math.random().toString(36).substring(2, 15)

  const config = useRuntimeConfig(event)
  const magicLink = `${config.public.siteUrl}/login/magic?token=${encodeURIComponent(token)}`
  const html = await render(EmailMagicLink, { magicLink })

  await sendMail({
    to: input.email,
    subject: 'Magic Link',
    html
  })

  return {
    message: 'Magic link sent to email'
  }
})
