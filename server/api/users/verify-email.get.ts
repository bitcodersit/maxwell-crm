import { render } from '@vue-email/render'
import EmailVerifyEmail from '@/components/emails/EmailVerifyEmail.vue'

const zVerifyEmail = z.object({
  token: z.string().min(1)
})

export default defineEventHandler(async event => {
  const input = await validate(getQuery(event), zVerifyEmail)

  const verificationToken = await prisma.token.findFirst({
    where: {
      token: input.token,
      modelType: 'USER',
      type: 'VERIFY',
      usedAt: null,
      OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }]
    },
    select: {
      id: true,
      modelId: true
    }
  })
  if (!verificationToken) {
    throw createError({
      statusCode: 400,
      message: 'Invalid or expired verification link'
    })
  }

  const user = await prisma.user.findFirst({
    where: {
      id: verificationToken.modelId,
      deletedAt: null
    },
    select: {
      id: true,
      name: true,
      email: true
    }
  })
  if (!user) {
    throw createError({
      statusCode: 400,
      message: 'Invalid or expired verification link'
    })
  }

  const emailChangeMeta = getEmailChangeTokenMeta(input.token)
  const nextEmail = emailChangeMeta?.email
  if (nextEmail) {
    const taken = await prisma.user.findFirst({
      where: {
        email: nextEmail,
        deletedAt: null,
        id: {
          not: user.id
        }
      },
      select: { id: true }
    })
    if (taken) {
      throw createError({
        statusCode: 400,
        message: 'Email is already taken'
      })
    }
  }

  if (emailChangeMeta?.stage === 'old-confirm' && nextEmail) {
    await prisma.$transaction([
      prisma.user.update({
        where: {
          id: user.id
        },
        data: {
          email: nextEmail,
          emailVerifiedAt: null
        }
      }),
      prisma.token.update({
        where: {
          id: verificationToken.id
        },
        data: {
          usedAt: new Date()
        }
      })
    ])

    const verifyLink = await createVerifyEmailLink(event, user.id)
    const html = await render(EmailVerifyEmail, {
      verifyLink,
      name: user.name
    })

    await queueEmail({
      to: nextEmail,
      subject: 'Verify your new email address',
      html
    })

    const session = await getUserSession(event)
    if (session?.user?.id === user.id) {
      await clearUserSession(event)
    }

    return {
      message: 'Email change success. You must login with your new email.',
      email: nextEmail,
      nextEmail,
      flow: 'email-change',
      forceLogout: true
    }
  }

  await prisma.$transaction([
    prisma.user.update({
      where: {
        id: user.id
      },
      data: {
        ...(nextEmail ? { email: nextEmail } : {}),
        emailVerifiedAt: new Date()
      }
    }),
    prisma.token.update({
      where: {
        id: verificationToken.id
      },
      data: {
        usedAt: new Date()
      }
    })
  ])

  return {
    message: 'Email has been verified. You can now close this window.',
    email: user.email,
    flow: 'normal',
    forceLogout: false
  }
})
