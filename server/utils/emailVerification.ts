import type { H3Event } from 'h3'
import { randomUUID } from 'node:crypto'

const EMAIL_CHANGE_OLD_PREFIX = 'change-old'

export const createVerifyEmailLink = async (event: H3Event, userId: number) => {
  const token = randomUUID()
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000)

  await prisma.$transaction([
    prisma.token.deleteMany({
      where: {
        modelId: userId,
        modelType: 'USER',
        type: 'VERIFY'
      }
    }),
    prisma.token.create({
      data: {
        modelId: userId,
        modelType: 'USER',
        type: 'VERIFY',
        token,
        expiresAt
      }
    })
  ])

  const config = useRuntimeConfig(event)
  return `${config.public.siteUrl}/verify-email?token=${encodeURIComponent(token)}`
}

export const createEmailChangeConfirmLink = async (
  event: H3Event,
  userId: number,
  nextEmail: string
) => {
  const encodedEmail = Buffer.from(nextEmail.trim().toLowerCase(), 'utf8').toString('base64url')
  const token = `${EMAIL_CHANGE_OLD_PREFIX}.${randomUUID()}.${encodedEmail}`
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000)

  await prisma.$transaction([
    prisma.token.deleteMany({
      where: {
        modelId: userId,
        modelType: 'USER',
        type: 'VERIFY'
      }
    }),
    prisma.token.create({
      data: {
        modelId: userId,
        modelType: 'USER',
        type: 'VERIFY',
        token,
        expiresAt
      }
    })
  ])

  const config = useRuntimeConfig(event)
  return `${config.public.siteUrl}/verify-email?token=${encodeURIComponent(token)}`
}

export const getEmailChangeTokenMeta = (token: string) => {
  const parts = token.split('.')
  if (parts.length < 3) return undefined

  const stageRaw = parts[0]
  if (stageRaw !== EMAIL_CHANGE_OLD_PREFIX) return undefined

  const encoded = parts[parts.length - 1]
  try {
    const email = Buffer.from(encoded, 'base64url').toString('utf8').trim().toLowerCase()
    if (!email || !email.includes('@')) return undefined
    return {
      stage: 'old-confirm',
      email
    } as const
  } catch {
    return undefined
  }
}
