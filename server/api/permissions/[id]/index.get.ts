export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event)
  if (!can(user, ['read-any-permissions'])) {
    throw err.denied()
  }
  const id = getRouterParam(event, 'id')
  const permission = await prisma.permission.findUnique({
    where: { id: Number(id) },
    include: {
      rolePermissions: {
        select: {
          id: true,
          role: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
    },
  })

  if (!permission) throw err.notFound()
  return permission
})
