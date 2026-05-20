import { render } from '@vue-email/render'
import EmailConfirmEmailChange from '@/components/emails/EmailConfirmEmailChange.vue'
import { createEmailChangeConfirmLink } from '~~/server/utils/emailVerification'
import { selectUserForSession } from '~~/server/utils/users'

const zMeUpdate = z.object({
  name: z.string().min(2).optional(),
  email: z.email().optional(),
  avatarId: z.number().nullable().optional()
})

export default defineEventHandler(async event => {
  const session = await requireUserSession(event)
  const currentUser = await getCurrentUser(event, session.user.id)

  if (!currentUser.updateOwnUsers) throw err.denied()

  const body = await readBody(event)
  const input = await validate(body, zMeUpdate)

  if (input.name === undefined && input.email === undefined && input.avatarId === undefined) {
    throw createError({
      statusCode: 400,
      message: 'No fields to update'
    })
  }

  const existing = await prisma.user.findUnique({
    where: {
      id: currentUser.id
    },
    select: {
      id: true,
      name: true,
      email: true,
      avatarId: true
    }
  })
  if (!existing) {
    throw err.unauth()
  }

  if (input.avatarId) {
    const att = await prisma.attachment.findFirst({
      where: {
        id: input.avatarId,
        deletedAt: null
      }
    })
    if (!att) {
      throw err.unprocessable({
        avatarId: {
          errors: ['Invalid attachment']
        }
      })
    }
  }

  if (input.avatarId && existing.avatarId && existing.avatarId !== input.avatarId) {
    await deleteAttachments(event, [existing.avatarId])
  }

  const requestedEmail = input.email?.trim().toLowerCase()
  const isEmailChangeRequested = !!requestedEmail && requestedEmail !== existing.email
  if (isEmailChangeRequested) {
    const taken = await prisma.user.findFirst({
      where: {
        email: requestedEmail,
        deletedAt: null,
        id: {
          not: existing.id
        }
      },
      select: { id: true }
    })
    if (taken) {
      throw createError({
        statusCode: 422,
        message: 'Email is already taken'
      })
    }
  }

  const user = await prisma.user.update({
    where: {
      id: currentUser.id
    },
    data: {
      ...(input.name ? { name: input.name } : {}),
      ...(input.avatarId ? { avatarId: input.avatarId } : {})
    },
    select: selectUserForSession
  })

  if (isEmailChangeRequested && requestedEmail) {
    const confirmLink = await createEmailChangeConfirmLink(event, user.id, requestedEmail)
    const html = await render(EmailConfirmEmailChange, {
      confirmLink,
      name: user.name,
      newEmail: requestedEmail
    })

    await queueEmail({
      to: existing.email!,
      subject: 'Confirm your email change request',
      html
    })
  }

  await replaceUserSession(event, {
    user: userToSession(user)
  })

  return {
    message: 'Profile updated successfully'
  }
})
