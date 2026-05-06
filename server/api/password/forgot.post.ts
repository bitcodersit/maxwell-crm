import ResetPassword from '@/components/emails/ResetPassword.vue'
import { render } from '@vue-email/render'
import { createResetPasswordLink } from '~~/server/utils/passwordReset'

const zForgotPassword = z.object({
  email: z.email(),
})

const RESEND_COOLDOWN_SECONDS = 30
export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const input = await validate(body, zForgotPassword)

  const user = await prisma.user.findFirst({
    where: {
      email: input.email,
      deletedAt: null,
    },
    select: {
      id: true,
      name: true,
      email: true,
    },
  })

  const message = 'If that email exists, we sent a password reset link.'
  if (!user) {
    return {
      message,
      retryAfterSec: RESEND_COOLDOWN_SECONDS,
    }
  }

  const lastToken = await prisma.token.findFirst({
    where: {
      modelId: user.id,
      modelType: 'USER',
      type: 'RESET',
    },
    orderBy: {
      createdAt: 'desc',
    },
    select: {
      createdAt: true,
    },
  })

  if (lastToken) {
    const elapsedMs = Date.now() - new Date(lastToken.createdAt).getTime()
    const cooldownMs = RESEND_COOLDOWN_SECONDS * 1000
    if (elapsedMs < cooldownMs) {
      const retryAfterSec = Math.ceil((cooldownMs - elapsedMs) / 1000)
      throw createError({
        statusCode: 429,
        message: `Please wait ${retryAfterSec}s before requesting another reset email.`,
        data: {
          retryAfterSec,
        },
      })
    }
  }

  const resetLink = await createResetPasswordLink(event, user.id)
  const html = await render(ResetPassword, {
    name: user.name,
    resetLink,
    expiresInMinutes: 5,
  })

  await sendMail({
    to: user.email,
    subject: 'Reset your password',
    html,
  })

  return {
    message,
    retryAfterSec: RESEND_COOLDOWN_SECONDS,
  }
})
