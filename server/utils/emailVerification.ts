import { randomUUID } from 'node:crypto'
import type { H3Event } from 'h3'

export const createVerifyEmailLink = async (event: H3Event, userId: number) => {
  const token = randomUUID()
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000)

  await prisma.$transaction([
    prisma.token.deleteMany({
      where: {
        modelId: userId,
        modelType: 'USER',
        type: 'VERIFY',
      },
    }),
    prisma.token.create({
      data: {
        modelId: userId,
        modelType: 'USER',
        type: 'VERIFY',
        token,
        expiresAt,
      },
    }),
  ])

  const config = useRuntimeConfig(event)
  return `${config.public.siteUrl}/verify-email?token=${encodeURIComponent(token)}`
}
