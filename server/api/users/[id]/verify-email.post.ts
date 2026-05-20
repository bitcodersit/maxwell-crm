import { render } from '@vue-email/render'
import EmailVerifyEmail from '@/components/emails/EmailVerifyEmail.vue'
import { isCustomerRoleName } from '~~/server/utils/customerRole'
import { createVerifyEmailLink } from '~~/server/utils/emailVerification'

export default defineEventHandler(async event => {
  const sessionUser = await getCurrentUser(event)
  if (!sessionUser.updateAnyUsers) {
    throw err.denied()
  }

  const id = Number(getRouterParam(event, 'id'))
  if (!id) throw err.notFound()

  const target = await prisma.user.findFirst({
    where: {
      id,
      deletedAt: null
    },
    select: {
      id: true,
      name: true,
      email: true,
      emailVerifiedAt: true,
      userRoles: {
        select: {
          role: {
            select: {
              name: true
            }
          }
        }
      }
    }
  })

  if (!target) throw err.notFound()
  if (target.emailVerifiedAt) {
    throw createError({
      statusCode: 400,
      message: 'Email is already verified'
    })
  }
  if (target.userRoles.some(ur => isCustomerRoleName(ur.role?.name))) {
    throw createError({
      statusCode: 400,
      message: 'Customer login is not enabled yet'
    })
  }

  const verifyLink = await createVerifyEmailLink(event, target.id)
  const html = await render(EmailVerifyEmail, {
    verifyLink,
    name: target.name
  })

  await queueEmail({
    to: target.email,
    subject: 'Verify your email address',
    html,
    action: {
      type: 'user-still-unverified',
      userId: target.id
    }
  })

  return {
    message: 'Verification email sent successfully'
  }
})
