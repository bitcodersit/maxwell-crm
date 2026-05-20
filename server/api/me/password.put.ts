const zPasswordChange = z.object({
  current: z.string().min(8),
  new: z.string().min(8)
})

export default defineEventHandler(async event => {
  const currentUser = await getCurrentUser(event)

  if (!currentUser.updateOwnUsers) {
    throw err.denied()
  }

  if (currentUser.isCustomer) {
    throw err.denied('Customer portal is not available yet')
  }

  const body = await readBody(event)
  const input = await validate(body, zPasswordChange)

  if (input.current === input.new) {
    throw err.unprocessable({
      new: {
        errors: ['New password must be different from your current password']
      }
    })
  }

  const user = await prisma.user.findUnique({
    where: { id: currentUser.id },
    select: { id: true, password: true }
  })
  if (!user) {
    throw err.unauth()
  }

  if (!user.password) {
    throw createError({
      statusCode: 400,
      message: 'This account has no password. Sign in with your provider or contact support.'
    })
  }

  const verified = await verifyPassword(user.password, input.current)
  if (!verified) {
    throw err.unprocessable({
      current: {
        errors: ['Current password is incorrect']
      }
    })
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      password: await hashPassword(input.new)
    }
  })

  return { ok: true }
})
