import { TaskItemStatus, TaskPriority, TaskStatus, type Prisma } from '~~/prisma/client/client'

const zItems = z.object({
  id: z.number(),
  name: z.string().default(''),
  status: z.enum(TaskItemStatus).default(TaskItemStatus.TODO),
  completedAt: z.coerce.date().nullish(),
  completedById: z.number().nullish()
})

const zTaskUser = z.object({
  userId: z.number()
})

const zTaskTeam = z.object({
  teamId: z.number()
})

const zTaskCommon = z.object({
  description: z.string().nullish(),
  status: z.enum(TaskStatus).optional().default(TaskStatus.TODO),
  priority: z.enum(TaskPriority).optional().default(TaskPriority.MEDIUM),
  dueAt: z.coerce.date().nullish(),
  items: z.array(zItems).optional()
})

export const zTaskPost = zTaskCommon.extend({
  name: zName('Task name is required!')
})

export const zTaskPatch = zTaskCommon.extend({
  name: zName('Task name is required!').optional(),
  users: z.array(zTaskUser).optional(),
  teams: z.array(zTaskTeam).optional()
})

export const TaskInclude = {
  creator: {
    select: UserSelectForOptions
  },
  reviewer: {
    select: UserSelectForOptions
  },
  users: {
    select: {
      id: true,
      userId: true,
      user: {
        select: UserSelectForOptions
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
                select: UserSelectForOptions
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
    orderBy: [
      {
        status: 'asc' as const
      },
      {
        sortOrder: 'asc' as const
      }
    ],
    select: {
      id: true,
      name: true,
      status: true,
      sortOrder: true,
      completedAt: true,
      completedById: true,
      completedBy: {
        select: UserSelectForOptions
      }
    }
  },
  attachables: {
    where: {
      attachment: {
        deletedAt: null
      }
    },
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
} satisfies Prisma.TaskInclude
