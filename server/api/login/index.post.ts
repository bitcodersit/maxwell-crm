const zLogin = z.object({
  email: z.email(),
  password: z.string().min(8),
})

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const input = await validate(body, zLogin)

  const user = await prisma.user.findUnique({
    where: {
      email: input.email,
    },
  })

  if (!user) throw err.unauth()

  const verified = await verifyPassword(user.password, input.password)
  if (!verified) throw err.unauth()

  await setUserSession(event, {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
    },
  })

  return getUserSession(event)
})
