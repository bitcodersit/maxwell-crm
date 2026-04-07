export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  const team = await prisma.team.findUnique({
    where: { id: Number(id) },
    include: {
      creator: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      members: {
        select: {
          id: true,
          assignedBy: true,
          role: true,
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          assignedByUser: {
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
