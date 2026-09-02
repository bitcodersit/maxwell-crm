import z from 'zod'
import type { Prisma } from '~~/prisma/client/client'
import { TargetFrequency, TargetStatus, TaskItemStatus, TaskKind, TaskPriority, TaskStatus } from '~~/prisma/client/enums'

export type TZTaskItem = z.infer<typeof zTaskItems>
const zTaskItems = z.object({
  id: z.number(),
  name: z.string().default(''),
  status: z.enum(TaskItemStatus).default(TaskItemStatus.TODO),
  completedAt: z.coerce.date().nullish(),
  completedById: z.number().nullish()
})

export type TZTaskUser = z.infer<typeof zTaskUser>
const zTaskUser = z.object({
  userId: z.number()
})

export type TZTaskTeam = z.infer<typeof zTaskTeam>
const zTaskTeam = z.object({
  teamId: z.number()
})

export type TZTaskCommon = z.infer<typeof zTaskCommon>
const zTaskCommon = z.object({
  description: z.string().nullish(),
  items: z.array(zTaskItems).optional()
})

export type TZTaskPost = z.infer<typeof zTaskPost>
export const zTaskPost = zTaskCommon.extend({
  name: zName('Task name is required!'),
  dueAt: zDateRequired('Date is required!'),
  status: z.enum(TaskStatus).optional().default(TaskStatus.TODO),
  priority: z.enum(TaskPriority).optional().default(TaskPriority.MEDIUM)
})

export type TZTaskPatch = z.infer<typeof zTaskPatch>
export const zTaskPatch = zTaskCommon.extend({
  name: zName('Task name is required!').optional(),
  dueAt: z.coerce.date().nullish(),
  status: z.enum(TaskStatus).nullish(),
  priority: z.enum(TaskPriority).nullish(),
  users: z.array(zTaskUser).optional(),
  teams: z.array(zTaskTeam).optional()
})

const zRecurrenceBase = z.object({
  frequency: z.enum(TargetFrequency),
  intervalDays: z.number().int().positive().nullish(),
  rangeStart: zDateRequired('Range start is required!'),
  rangeEnd: zDateRequired('Range end is required!'),
  endsAt: z.coerce.date().nullish()
})

export type TZTargetRecurrence = z.infer<typeof zRecurrenceBase>

export type TZTargetPost = z.infer<typeof zTargetPost>
export const zTargetPost = zTaskCommon
  .extend({
    name: zName('Target name is required!'),
    priority: z.enum(TaskPriority).optional().default(TaskPriority.MEDIUM),
    frequency: z.enum(TargetFrequency),
    intervalDays: z.number().int().positive().nullish(),
    rangeStart: zDateRequired('Range start is required!'),
    rangeEnd: zDateRequired('Range end is required!'),
    endsAt: z.coerce.date().nullish()
  })
  .superRefine((data, ctx) => {
    if (data.rangeEnd < data.rangeStart) {
      ctx.addIssue({
        code: 'custom',
        path: ['rangeEnd'],
        message: 'Range end must be on or after range start'
      })
    }
    if (data.endsAt && data.endsAt < data.rangeStart) {
      ctx.addIssue({
        code: 'custom',
        path: ['endsAt'],
        message: 'Ends at must be on or after range start'
      })
    }
  })

export type TZTargetPatch = z.infer<typeof zTargetPatch>
export const zTargetPatch = zTaskCommon
  .extend({
    name: zName('Target name is required!').optional(),
    startsAt: z.coerce.date().nullish(),
    dueAt: z.coerce.date().nullish(),
    targetStatus: z.enum(TargetStatus).nullish(),
    priority: z.enum(TaskPriority).nullish(),
    users: z.array(zTaskUser).optional(),
    teams: z.array(zTaskTeam).optional(),
    frequency: z.enum(TargetFrequency).nullish(),
    intervalDays: z.number().int().positive().nullish(),
    rangeStart: z.coerce.date().nullish(),
    rangeEnd: z.coerce.date().nullish(),
    endsAt: z.coerce.date().nullish()
  })
  .superRefine((data, ctx) => {
    if (data.rangeStart && data.rangeEnd && data.rangeEnd < data.rangeStart) {
      ctx.addIssue({
        code: 'custom',
        path: ['rangeEnd'],
        message: 'Range end must be on or after range start'
      })
    }
  })

export const TaskInclude = {
  creator: {
    select: UserSelectForOptions
  },
  reviewer: {
    select: UserSelectForOptions
  },
  submitter: {
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
  attachable: {
    select: {
      id: true,
      attachments: {
        where: {
          deletedAt: null
        },
        select: {
          id: true,
          name: true,
          path: true,
          mime: true,
          size: true,
          provider: true,
          createdAt: true,
          updatedAt: true
        }
      }
    }
  }
} satisfies Prisma.TaskInclude

export const TargetInclude = {
  ...TaskInclude,
  users: {
    select: {
      id: true,
      userId: true,
      user: {
        select: {
          ...UserSelectForOptions,
          avatar: {
            select: {
              path: true
            }
          }
        }
      }
    }
  },
  recurrence: true,
  parent: {
    select: {
      id: true,
      name: true,
      kind: true,
      recurrence: true
    }
  }
} satisfies Prisma.TaskInclude

export const taskKindWhere = (kind: TaskKind): Prisma.TaskWhereInput => ({
  kind
})

export const targetOccurrenceWhere = (): Prisma.TaskWhereInput => ({
  kind: TaskKind.TARGET,
  parentId: { not: null }
})

export const getTaskOwnScope = (userId: number): Prisma.TaskWhereInput => ({
  OR: [
    { creatorId: userId },
    { reviewerId: userId },
    { submitterId: userId },
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
})
