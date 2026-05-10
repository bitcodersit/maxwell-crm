import type { Prisma } from '~~/prisma/client/client'
import { render } from '@vue-email/render'
import EmailPasswordUpdated from '@/components/emails/EmailPasswordUpdated.vue'
import EmailWelcomeUser from '@/components/emails/EmailWelcomeUser.vue'
import { CUSTOMER_ROLE_NAME, isCustomerRoleName } from '~~/server/utils/customerRole'
import { createVerifyEmailLink } from '~~/server/utils/emailVerification'
import { createResetPasswordLink } from '~~/server/utils/passwordReset'

const zUser = z.object({
  id: z.number().nullish(),
  name: zName(),
  email: zEmail(),
  password: zPassword().nullish(),
  // phone: zPhone({ nullish: true }),
  roleIds: z.array(z.number()).min(1, 'At least one role is required')
})
// .transform(data => {
//   return {
//     ...data,
//     phone: data.phone ? zPhoneParse(data.phone) : null
//   }
// })

const validateNonCustomerRoles = async (roleIds: number[]) => {
  if (!roleIds.length) return
  const roles = await prisma.role.findMany({
    where: {
      id: {
        in: roleIds
      }
    },
    select: {
      name: true
    }
  })
  const hasCustomerRole = roles.some(role => isCustomerRoleName(role.name))
  if (hasCustomerRole) {
    throw err.unprocessable({
      roleIds: {
        errors: [`Use the Customers module to assign ${CUSTOMER_ROLE_NAME} role`]
      }
    })
  }
}

export default defineEventHandler(async event => {
  const { user: sessionUser } = await requireUserSession(event)
  const body = await readBody(event)
  const input = await validate(body, zUser)
  await validateNonCustomerRoles(input.roleIds)
  if (input.id) {
    if (!can(sessionUser, ['update-any-users'])) {
      throw err.denied()
    }
    const existing = await prisma.user.findUnique({
      where: {
        id: input.id
      },
      select: {
        email: true,
        password: true,
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
    if (!existing) throw err.notFound()
    if (existing.userRoles.some(ur => isCustomerRoleName(ur.role?.name))) {
      throw err.unprocessable({
        id: {
          errors: ['Use the Customers module to update customer accounts']
        }
      })
    }

    const data: Prisma.UserUpdateInput = {
      name: input.name,
      email: input.email,
      // phone: input.phone,
      userRoles: input.roleIds
        ? {
            createMany: {
              skipDuplicates: true,
              data: input.roleIds.map(roleId => ({ roleId }))
            },
            deleteMany: {
              roleId: {
                notIn: input.roleIds
              }
            }
          }
        : undefined
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
          type: 'VERIFY'
        }
      })
    }
    const user = await prisma.user.update({
      where: {
        id: input.id
      },
      data,
      include: {
        creator: {
          select: {
            id: true,
            name: true
          }
        },
        userRoles: {
          include: {
            role: true
          }
        }
      }
    })

    const config = useRuntimeConfig(event)
    const loginUrl = `${config.public.siteUrl}/login`
    const emailChanged = existing.email && existing.email !== input.email

    if (emailChanged && user.email) {
      const needsResetLink = !input.password && !existing.password
      const resetLink = needsResetLink ? await createResetPasswordLink(event, user.id) : undefined
      const verifyLink = await createVerifyEmailLink(event, user.id)
      const html = await render(EmailWelcomeUser, {
        name: user.name,
        loginEmail: user.email,
        loginUrl,
        loginPassword: input.password || undefined,
        resetLink,
        verifyLink
      })
      await queueEmail({
        to: user.email,
        subject: 'Welcome to Maxwell CRM',
        html
      })
    }

    if (input.password && user.email) {
      const html = await render(EmailPasswordUpdated, {
        name: user.name,
        loginEmail: user.email,
        loginPassword: input.password,
        loginUrl
      })
      await queueEmail({
        to: user.email,
        subject: 'Your password has been updated',
        html
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
      creatorId: sessionUser.id,
      // phone: input.phone,
      password,
      userRoles: {
        createMany: {
          data: (input.roleIds || []).map(roleId => ({ roleId }))
        }
      }
    },
    include: {
      creator: {
        select: {
          id: true,
          name: true
        }
      },
      userRoles: {
        include: {
          role: true
        }
      }
    }
  })

  if (user.email) {
    const config = useRuntimeConfig(event)
    const loginUrl = `${config.public.siteUrl}/login`
    const resetLink = !input.password ? await createResetPasswordLink(event, user.id) : undefined
    const verifyLink = await createVerifyEmailLink(event, user.id)
    const html = await render(EmailWelcomeUser, {
      name: user.name,
      loginEmail: user.email,
      loginUrl,
      loginPassword: input.password || undefined,
      resetLink,
      verifyLink
    })
    await queueEmail({
      to: user.email,
      subject: 'Welcome to Maxwell CRM',
      html
    })
  }

  return user
})
