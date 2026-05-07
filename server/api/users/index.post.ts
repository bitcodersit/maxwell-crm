import { Prisma } from '~~/prisma/client/client'
import WelcomeUser from '@/components/emails/WelcomeUser.vue'
import PasswordUpdated from '@/components/emails/PasswordUpdated.vue'
import { render } from '@vue-email/render'
import { createResetPasswordLink } from '~~/server/utils/passwordReset'
import { createVerifyEmailLink } from '~~/server/utils/emailVerification'

const zUser = z.object({
  id: z.number().nullish(),
  name: z.string().min(1),
  email: z.email(),
  password: z.string().min(8).nullish(),
  roleIds: z.array(z.number()).min(1, 'At least one role is required'),
})

export default defineEventHandler(async (event) => {
  const { user: sessionUser } = await requireUserSession(event)
  const body = await readBody(event)
  const input = await validate(body, zUser)
  if (input.id) {
    if (!can(sessionUser, ['update-any-users'])) {
      throw err.denied()
    }
    const existing = await prisma.user.findUnique({
      where: {
        id: input.id,
      },
      select: {
        email: true,
        password: true,
      },
    })
    if (!existing) throw err.notFound()

    const data: Prisma.UserUpdateInput = {
      name: input.name,
      email: input.email,
      userRoles: input.roleIds
        ? {
            createMany: {
              skipDuplicates: true,
              data: input.roleIds.map((roleId) => ({ roleId })),
            },
            deleteMany: {
              roleId: {
                notIn: input.roleIds,
              },
            },
          }
        : undefined,
    }
    if (input.password) {
      data.password = await hashPassword(input.password)
    }
    if (existing.email !== input.email) {
      data.emailVerifiedAt = null
      await prisma.token.deleteMany({
        where: {
          modelId: input.id,
          modelType: 'USER',
          type: 'VERIFY',
        },
      })
    }
    const user = await prisma.user.update({
      where: {
        id: input.id,
      },
      data,
      include: {
        userRoles: {
          include: {
            role: true,
          },
        },
      },
    })

    const config = useRuntimeConfig(event)
    const loginUrl = `${config.public.siteUrl}/login`
    const emailChanged = existing.email !== input.email

    if (emailChanged) {
      const needsResetLink = !input.password && !existing.password
      const resetLink = needsResetLink ? await createResetPasswordLink(event, user.id) : undefined
      const verifyLink = await createVerifyEmailLink(event, user.id)
      const html = await render(WelcomeUser, {
        name: user.name,
        loginEmail: user.email,
        loginUrl,
        loginPassword: input.password || undefined,
        resetLink,
        verifyLink,
      })
      await queueEmail({
        to: user.email,
        subject: 'Welcome to Maxwell CRM',
        html,
      })
    }

    if (input.password) {
      const html = await render(PasswordUpdated, {
        name: user.name,
        loginEmail: user.email,
        loginPassword: input.password,
        loginUrl,
      })
      await queueEmail({
        to: user.email,
        subject: 'Your password has been updated',
        html,
      })
    }

    return user
  }

  if (!can(sessionUser, ['create-any-users'])) {
    throw err.denied()
  }

  const password = input.password ? await hashPassword(input.password) : undefined
  const user = await prisma.user.create({
    data: {
      name: input.name,
      email: input.email,
      password,
      userRoles: {
        createMany: {
          data: (input.roleIds || []).map((roleId) => ({ roleId })),
        },
      },
    },
    include: {
      userRoles: {
        include: {
          role: true,
        },
      },
    },
  })

  const config = useRuntimeConfig(event)
  const loginUrl = `${config.public.siteUrl}/login`
  const resetLink = !input.password ? await createResetPasswordLink(event, user.id) : undefined
  const verifyLink = await createVerifyEmailLink(event, user.id)
  const html = await render(WelcomeUser, {
    name: user.name,
    loginEmail: user.email,
    loginUrl,
    loginPassword: input.password || undefined,
    resetLink,
    verifyLink,
  })
  await queueEmail({
    to: user.email,
    subject: 'Welcome to Maxwell CRM',
    html,
  })

  return user
})
