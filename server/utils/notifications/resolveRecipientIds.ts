const ADMIN_ROLE_NAMES = ['Super Admin', 'Admin'] as const

export type TResolveRecipientIdsInput = {
  recipientIds?: number[]
  assignableId?: number | null
  includeAdmins?: boolean
  excludeUserIds?: number[]
  /** Skip the actor from recipients. Defaults to true. */
  skipActor?: boolean
  actorId?: number | null
}

const uniquePositiveIds = (ids: Iterable<number>) => {
  return [...new Set([...ids].filter(id => Number.isInteger(id) && id > 0))]
}

export const getAdminUserIds = async () => {
  const admins = await prisma.userRole.findMany({
    where: {
      role: {
        name: {
          in: [...ADMIN_ROLE_NAMES]
        },
        deletedAt: null
      },
      user: {
        deletedAt: null
      }
    },
    select: {
      userId: true
    }
  })

  return uniquePositiveIds(admins.map(row => row.userId))
}

export const getAssignableUserIds = async (assignableId: number) => {
  const assignable = await prisma.assignable.findUnique({
    where: {
      id: assignableId
    },
    select: {
      users: {
        where: {
          user: {
            deletedAt: null
          }
        },
        select: {
          userId: true
        }
      },
      teams: {
        where: {
          team: {
            deletedAt: null
          }
        },
        select: {
          team: {
            select: {
              members: {
                where: {
                  deletedAt: null,
                  user: {
                    deletedAt: null
                  }
                },
                select: {
                  userId: true
                }
              }
            }
          }
        }
      }
    }
  })

  if (!assignable) return []

  const userIds = assignable.users.map(row => row.userId)
  const teamUserIds = assignable.teams.flatMap(
    row => row.team?.members.map(member => member.userId) ?? []
  )

  return uniquePositiveIds([...userIds, ...teamUserIds])
}

export const resolveRecipientIds = async (input: TResolveRecipientIdsInput) => {
  const includeAdmins = input.includeAdmins ?? true
  const skipActor = input.skipActor ?? true

  const excluded = new Set(
    uniquePositiveIds([
      ...(input.excludeUserIds ?? []),
      ...(skipActor && input.actorId ? [input.actorId] : [])
    ])
  )

  const chunks: number[][] = [input.recipientIds ?? []]

  if (input.assignableId) {
    chunks.push(await getAssignableUserIds(input.assignableId))
  }

  if (includeAdmins) {
    chunks.push(await getAdminUserIds())
  }

  return uniquePositiveIds(chunks.flat()).filter(id => !excluded.has(id))
}
