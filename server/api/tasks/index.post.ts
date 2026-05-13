export default defineEventHandler(async event => {
  const { user } = await requireUserSession(event)
  if (!user.can?.createAnyTasks) {
    throw err.denied()
  }

  const body = await readBody(event)
  const input = await validate(body, zTaskPost)

  return prisma.task.create({
    include: TaskInclude,
    data: {
      name: input.name,
      description: input.description,
      status: input.status,
      priority: input.priority,
      dueAt: input.dueAt,
      creatorId: user.id,
      reviewerId: user.id,
      reviewedAt: new Date(),
      items: {
        createMany: {
          data: (input.items || []).map((item, sortOrder) => ({
            sortOrder,
            name: item.name,
            status: item.status,
            completedAt: item.status === TaskItemStatus.COMPLETED ? new Date() : null,
            completedById: item.status === TaskItemStatus.COMPLETED ? user.id : null
          }))
        }
      }
    }
  })
})
