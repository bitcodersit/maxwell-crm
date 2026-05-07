const zVerifyEmail = z.object({
  token: z.string().min(1),
})

export default defineEventHandler(async (event) => {
  const input = await validate(getQuery(event), zVerifyEmail)

  const verificationToken = await prisma.token.findFirst({
    where: {
      token: input.token,
      modelType: 'USER',
      type: 'VERIFY',
      usedAt: null,
      OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
    },
    select: {
      id: true,
      modelId: true,
    },
  })
  if (!verificationToken) {
    throw createError({
      statusCode: 400,
      message: 'Invalid or expired verification link',
    })
  }

  const user = await prisma.user.findFirst({
    where: {
      id: verificationToken.modelId,
      deletedAt: null,
    },
    select: {
      id: true,
      email: true,
    },
  })
  if (!user) {
    throw createError({
      statusCode: 400,
      message: 'Invalid or expired verification link',
    })
  }

  await prisma.$transaction([
    prisma.user.update({
      where: {
        id: user.id,
      },
      data: {
        emailVerifiedAt: new Date(),
      },
    }),
    prisma.token.update({
      where: {
        id: verificationToken.id,
      },
      data: {
        usedAt: new Date(),
      },
    }),
  ])

  return {
    message: 'Email verified successfully',
    email: user.email,
  }
})
