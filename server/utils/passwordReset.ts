import { randomUUID } from 'node:crypto'
import type { H3Event } from 'h3'

export const RESET_TOKEN_TTL_SECONDS = 5 * 60

export const createResetPasswordLink = async (event: H3Event, userId: number) => {
  const token = randomUUID()
  const expiresAt = new Date(Date.now() + RESET_TOKEN_TTL_SECONDS * 1000)

  await prisma.$transaction([
    prisma.token.deleteMany({
      where: {
        modelId: userId,
        modelType: 'USER',
        type: 'RESET',
      },
    }),
    prisma.token.create({
      data: {
        modelId: userId,
        modelType: 'USER',
        type: 'RESET',
        token,
        expiresAt,
      },
    }),
  ])

  const config = useRuntimeConfig(event)
  return `${config.public.siteUrl}/reset-password?token=${encodeURIComponent(token)}`
}
