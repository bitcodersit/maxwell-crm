import { getEmailChangeTokenMeta } from '~~/server/utils/emailVerification'

export default defineEventHandler(async event => {
  const currentUser = await getCurrentUser(event)
  if (!currentUser.readOwnUsers) {
    throw err.denied()
  }

  const me = await prisma.user.findFirst({
    where: {
      id: currentUser.id,
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
      modelId: currentUser.id,
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
