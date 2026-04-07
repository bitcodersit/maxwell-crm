export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  const team = await prisma.team.findUnique({
    where: { id: Number(id) },
    include: {
      members: {
        select: {
          id: true,
          role: true,
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      },
    },
  })

  if (!team) throw err.notFound()
  return team
})
