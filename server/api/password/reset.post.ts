const zResetPassword = z
  .object({
    token: z.string().min(1),
    password: z.string().min(8),
    passwordConfirmation: z.string().min(8),
  })
  .refine((data) => data.password === data.passwordConfirmation, {
    path: ['passwordConfirmation'],
    message: 'Passwords do not match',
  })

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const input = await validate(body, zResetPassword)

  const resetToken = await prisma.token.findFirst({
    where: {
      token: input.token,
      modelType: 'USER',
      type: 'RESET',
      usedAt: null,
      OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
    },
    select: {
      id: true,
      modelId: true,
    },
  })

  if (!resetToken) {
    throw createError({
      statusCode: 400,
      message: 'Invalid or expired reset link',
    })
  }

  const user = await prisma.user.findFirst({
    where: {
      id: resetToken.modelId,
      deletedAt: null,
    },
    select: {
      id: true,
    },
  })
  if (!user) {
    throw createError({
      statusCode: 400,
      message: 'Invalid or expired reset link',
    })
  }

  await prisma.$transaction([
    prisma.user.update({
      where: { id: user.id },
      data: {
        password: await hashPassword(input.password),
      },
    }),
    prisma.token.update({
      where: { id: resetToken.id },
      data: {
        usedAt: new Date(),
      },
    }),
    prisma.token.deleteMany({
      where: {
        modelId: user.id,
        modelType: 'USER',
        type: 'RESET',
        id: {
          not: resetToken.id,
        },
      },
    }),
  ])

  return {
    message: 'Password reset successful. You can now sign in.',
  }
})
