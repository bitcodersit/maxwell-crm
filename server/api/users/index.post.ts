export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { id, ...data } = body
  if (id) {
    const user = await prisma.user.update({
      data,
      where: {
        id: Number(id),
      },
    })
    return user
  }
  const user = await prisma.user.create({
    data,
  })
  return user
})
