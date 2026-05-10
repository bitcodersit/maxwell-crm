import { Prisma } from '~~/prisma/client/client'

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
      { sortOrder: 'asc' as const }
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
