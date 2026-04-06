const zMagic = z.object({
  email: z.email(),
})

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const input = await validate(body, zMagic)

  const user = await prisma.user.findUnique({
    where: {
      email: input.email,
    },
  })

  if (!user) throw err.notFound()

  const token = Math.random().toString(36).substring(2, 15)

  await sendMail({
    to: input.email,
    subject: 'Magic Link',
    html: `Click here to login: <a href="${process.env.NUXT_APP_URL}/login/magic?token=${token}">${process.env.NUXT_APP_URL}/login/magic?token=${token}</a>`,
  })

  return {
    message: 'Magic link sent to email',
  }
})
