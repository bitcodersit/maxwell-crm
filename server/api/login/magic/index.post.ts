import MagicLink from '@/components/emails/MagicLink.vue'
import { render } from '@vue-email/render'

const zMagic = z.object({
  email: z.email(),
})

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const input = await validate(body, zMagic)

  const user = await prisma.user.findUnique({
    where: {
      email: input.email,
    },
  })

  if (!user) throw err.notFound()

  const token = Math.random().toString(36).substring(2, 15)

  const config = useRuntimeConfig(event)
  const magicLink = `${config.public.siteUrl}/login/magic?token=${encodeURIComponent(token)}`
  const html = await render(MagicLink, { magicLink })

  await sendMail({
    to: input.email,
    subject: 'Magic Link',
    html,
  })

  return {
    message: 'Magic link sent to email',
  }
})
