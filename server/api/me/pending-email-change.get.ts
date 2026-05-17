import { getEmailChangeTokenMeta } from '~~/server/utils/emailVerification'

export default defineEventHandler(async event => {
  const { user: sessionUser } = await requireUserSession(event)
  if (!sessionUser.readOwnUsers) {
    throw err.denied()
  }

  const me = await prisma.user.findFirst({
    where: {
      id: sessionUser.id,
      deletedAt: null
    },
    select: {
      email: true,
      emailVerifiedAt: true
    }
  })
  if (!me) {
    throw err.unauth()
  }

  const token = await prisma.token.findFirst({
    where: {
      modelId: sessionUser.id,
      modelType: 'USER',
      type: 'VERIFY',
      token: { startsWith: 'change-old.' },
      usedAt: null,
      AND: [{ OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }] }]
    },
    orderBy: {
      createdAt: 'desc'
    },
    select: {
      token: true,
      expiresAt: true
    }
  })

  const meta = token ? getEmailChangeTokenMeta(token.token) : undefined
  if (!meta) {
    if (!me.emailVerifiedAt) {
      return {
        pendingEmail: me.email,
        stage: 'new-verify',
        expiresAt: null
      }
    }
    return {
      pendingEmail: null,
      stage: null,
      expiresAt: null
    }
  }

  return {
    pendingEmail: meta.email,
    stage: meta.stage,
    expiresAt: token?.expiresAt ?? null
  }
})
