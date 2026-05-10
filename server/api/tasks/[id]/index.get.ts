import type { Prisma } from '~~/prisma/client/client'

const taskInclude = {
  creator: {
    select: {
      id: true,
      name: true,
      email: true,
      avatarId: true
    }
  },
  reviewer: {
    select: {
      id: true,
      name: true,
      email: true,
      avatarId: true
    }
  },
  users: {
    select: {
      id: true,
      userId: true,
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          avatarId: true
        }
      }
    }
  },
  teams: {
    select: {
      id: true,
      teamId: true,
      team: {
        select: {
          id: true,
          name: true,
          description: true,
          members: {
            select: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  avatarId: true
                }
              }
            }
          }
        }
      }
    }
  },
  items: {
    where: {
      deletedAt: null
    },
    orderBy: [{ status: 'asc' as const }, { sortOrder: 'asc' as const }],
    select: {
      id: true,
      name: true,
      status: true,
      sortOrder: true,
      completedAt: true,
      completedById: true,
      completedBy: {
        select: {
          id: true,
          name: true
        }
      }
    }
  },
  attachables: {
    select: {
      id: true,
      attachmentId: true,
      attachment: {
        select: {
          id: true,
          name: true,
          path: true,
          mime: true,
          size: true,
          provider: true,
          createdAt: true
        }
      }
    }
  }
}

const getOwnScope = (userId: number) =>
  ({
    OR: [
      { creatorId: userId },
      { reviewerId: userId },
      { users: { some: { userId } } },
      {
        teams: {
          some: {
            team: {
              members: {
                some: {
                  userId
                }
              }
            }
          }
        }
      }
    ]
  }) satisfies Prisma.TaskWhereInput

export default defineEventHandler(async event => {
  const { user } = await requireUserSession(event)
  if (!can(user, ['read-any-tasks', 'read-own-tasks'])) {
    throw err.denied()
  }

  const id = Number(getRouterParam(event, 'id'))
  if (!Number.isInteger(id) || id < 1) {
    throw err.notFound()
  }

  const where: Prisma.TaskWhereInput = {
    id,
    deletedAt: null,
    ...(can(user, ['read-any-tasks']) ? {} : getOwnScope(user.id))
  }

  const task = await prisma.task.findFirst({
    where,
    include: taskInclude
  })

  if (!task) throw err.notFound()
  return task
})
