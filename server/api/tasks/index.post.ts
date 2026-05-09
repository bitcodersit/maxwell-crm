import { TaskItemStatus, TaskPriority, TaskStatus } from '~~/prisma/client/enums'
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
          description: true
        }
      }
    }
  },
  items: {
    where: {
      deletedAt: null
    },
    orderBy: {
      sortOrder: 'asc' as const
    },
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

const zTaskItemInput = z.object({
  name: z.string().min(1),
  checked: z.boolean().optional(),
  completed: z.boolean().optional(),
  status: z.nativeEnum(TaskItemStatus).optional()
})

const zTaskPost = z.object({
  name: z.string().min(1),
  description: z.string().nullish(),
  status: z.nativeEnum(TaskStatus).optional().default(TaskStatus.TODO),
  priority: z.nativeEnum(TaskPriority).optional().default(TaskPriority.MEDIUM),
  dueAt: z.coerce.date().nullable().optional(),
  reviewerId: z.number().int().positive().nullable().optional(),
  userIds: z.array(z.number().int().positive()).optional(),
  teamIds: z.array(z.number().int().positive()).optional(),
  attachmentIds: z.array(z.number().int().positive()).optional(),
  items: z.array(zTaskItemInput).optional()
})

const getItemStatus = (item: z.infer<typeof zTaskItemInput>) => {
  if (item.status) return item.status
  return item.checked || item.completed ? TaskItemStatus.COMPLETED : TaskItemStatus.TODO
}

export default defineEventHandler(async event => {
  const { user } = await requireUserSession(event)
  if (!can(user, ['create-any-tasks', 'create-own-tasks'])) {
    throw err.denied()
  }

  const body = await readBody(event)
  const input = await validate(body, zTaskPost)

  if (input.reviewerId) {
    const reviewerExists = await prisma.user.count({
      where: {
        id: input.reviewerId,
        deletedAt: null
      }
    })
    if (!reviewerExists) {
      throw err.unprocessable({
        reviewerId: {
          errors: ['Reviewer not found']
        }
      })
    }
  }

  const now = new Date()
  const items = (input.items || []).map((item, index) => {
    const status = getItemStatus(item)
    return {
      name: item.name,
      sortOrder: index + 1,
      status,
      completedAt: status === TaskItemStatus.COMPLETED ? now : null,
      completedById: status === TaskItemStatus.COMPLETED ? user.id : null
    }
  })

  const createData: Prisma.TaskCreateInput = {
    name: input.name,
    description: input.description,
    status: input.status,
    priority: input.priority,
    dueAt: input.dueAt ?? null,
    creator: {
      connect: {
        id: user.id
      }
    },
    reviewer: input.reviewerId
      ? {
          connect: {
            id: input.reviewerId
          }
        }
      : undefined,
    users: input.userIds?.length
      ? {
          createMany: {
            skipDuplicates: true,
            data: input.userIds.map(userId => ({ userId }))
          }
        }
      : undefined,
    teams: input.teamIds?.length
      ? {
          createMany: {
            skipDuplicates: true,
            data: input.teamIds.map(teamId => ({ teamId }))
          }
        }
      : undefined,
    items: items.length
      ? {
          createMany: {
            data: items
          }
        }
      : undefined,
    attachables: input.attachmentIds?.length
      ? {
          createMany: {
            skipDuplicates: true,
            data: input.attachmentIds.map(attachmentId => ({ attachmentId }))
          }
        }
      : undefined
  }

  const created = await prisma.task.create({
    data: createData,
    include: taskInclude
  })

  return created
})
