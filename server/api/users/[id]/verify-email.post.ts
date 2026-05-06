import VerifyEmail from '@/components/emails/VerifyEmail.vue'
import { render } from '@vue-email/render'
import { createVerifyEmailLink } from '~~/server/utils/emailVerification'

export default defineEventHandler(async (event) => {
  const { user: sessionUser } = await requireUserSession(event)
  if (!can(sessionUser, ['update-any-users'])) {
    throw err.denied()
  }

  const id = Number(getRouterParam(event, 'id'))
  if (!id) throw err.notFound()

  const target = await prisma.user.findFirst({
    where: {
      id,
      deletedAt: null,
    },
    select: {
      id: true,
      name: true,
      email: true,
      emailVerifiedAt: true,
    },
  })

  if (!target) throw err.notFound()
  if (target.emailVerifiedAt) {
    throw createError({
      statusCode: 400,
      message: 'Email is already verified',
    })
  }

  const verifyLink = await createVerifyEmailLink(event, target.id)
  const html = await render(VerifyEmail, {
    verifyLink,
    name: target.name,
  })

  await queueEmail({
    to: target.email,
    subject: 'Verify your email address',
    html,
    action: {
      type: 'user-still-unverified',
      userId: target.id,
    },
  })

  return {
    message: 'Verification email sent successfully',
  }
})
