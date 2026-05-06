import { randomUUID } from 'node:crypto'
import VerifyEmail from '@/components/emails/VerifyEmail.vue'
import { render } from '@vue-email/render'

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

  const token = randomUUID()
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24)
  await prisma.$transaction(async (tx) => {
    await tx.token.deleteMany({
      where: {
        modelId: target.id,
        modelType: 'USER',
        type: 'VERIFY',
      },
    })
    await tx.token.create({
      data: {
        modelId: target.id,
        modelType: 'USER',
        type: 'VERIFY',
        token,
        expiresAt,
      },
    })
  })

  const config = useRuntimeConfig(event)
  const verifyLink = `${config.public.siteUrl}/verify-email?token=${encodeURIComponent(token)}`
  const html = await render(VerifyEmail, {
    verifyLink,
    name: target.name,
  })

  await sendMail({
    to: target.email,
    subject: 'Verify your email address',
    html,
  })

  return {
    message: 'Verification email sent successfully',
  }
})
