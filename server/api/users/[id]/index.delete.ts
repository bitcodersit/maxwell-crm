export default defineEventHandler(async (event) => {
  const { id } = getRouterParams(event)
  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: 'User ID is required',
    })
  }
  const user = await prisma.user.delete({
    where: {
      id: Number(id),
    },
  })
  return user
})
