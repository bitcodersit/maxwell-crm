export default defineEventHandler(async (event) => {
  const users = await prisma.user.findMany({
    orderBy: {
      createdAt: 'desc',
    },
  })
  return users
})
