import { TeamMemberRole } from '~~/prisma/client/enums'

export default defineEventHandler(async event => {
  try {
    const { user } = await requireUserSession(event)

    const body = await readBody(event)
    const input = await validate(body, zTeam)

    if (input.id) {
      const canUpdateAnyTeam = !!user.updateAnyTeams
      const canUpdateOwnTeam = !!user.updateOwnTeams
      const shouldFindLeader = !!input.members?.length || (!canUpdateAnyTeam && canUpdateOwnTeam)

      const leader = shouldFindLeader
        ? await prisma.teamMember.findFirst({
            where: {
              teamId: input.id,
              userId: user.id,
              role: TeamMemberRole.LEADER
            },
            select: {
              id: true,
              role: true
            }
          })
        : null

      if (!canUpdateAnyTeam) {
        if (!canUpdateOwnTeam) throw err.denied()
        if (!leader) throw err.denied()
      }

      if (input.members?.length && leader) {
        const currentUserInMembers = input.members.find(member => member.userId === user.id)

        if (!currentUserInMembers) {
          throw err.unprocessable({
            members: {
              errors: ['Team leader cannot remove themselves from the team']
            }
          })
        }

        if (currentUserInMembers.role !== TeamMemberRole.LEADER) {
          throw err.unprocessable({
            members: {
              errors: ['Team leader cannot change their own role']
            }
          })
        }
      }

      const team = await prisma.team.update({
        include,
        where: {
          id: input.id
        },
        data: {
          avatarId: input.avatarId,
          name: input.name,
          description: input.description,
          members: input.members?.length
            ? {
                deleteMany: {
                  userId: {
                    notIn: input.members.map(member => member.userId)
                  }
                },
                upsert: input.members.map(member => ({
                  where: {
                    teamId_userId: {
                      teamId: input.id!,
                      userId: member.userId
                    }
                  },
                  update: {
                    role: member.role
                  },
                  create: {
                    role: member.role,
                    userId: member.userId,
                    assignerId: user.id
                  }
                }))
              }
            : undefined
        }
      })
      return team
    }

    if (!user.createAnyTeams) {
      throw err.denied()
    }

    const team = await prisma.team.create({
      include,
      data: {
        avatarId: input.avatarId,
        name: input.name,
        creatorId: user.id,
        description: input.description,
        members: {
          createMany: {
            data: (input.members || []).map(member => ({
              userId: member.userId,
              role: member.role,
              assignerId: user.id
            }))
          }
        }
      }
    })
    return team
  } catch (error: any) {
    const message = error.message || ''
    if (message.includes('not found')) throw err.notFound()
    if (message.includes('teams_name_key')) {
      throw err.unprocessable({
        name: {
          errors: ['Name is already taken, please try a different name']
        }
      })
    }
    throw error
  }
})

const selectUser = {
  id: true,
  name: true,
  email: true
}

const include = {
  creator: {
    select: selectUser
  },
  members: {
    include: {
      user: {
        select: selectUser
      },
      assigner: {
        select: selectUser
      }
    }
  }
}

const zTeam = z.object({
  id: z.number().nullish(),
  avatarId: z.number().nullable().optional(),
  name: z.string().min(1),
  description: z.string().nullish(),
  members: z
    .array(
      z.object({
        userId: z.number(),
        role: z.enum(TeamMemberRole).default(TeamMemberRole.MEMBER)
      })
    )
    .min(1, 'At least one member is required')
    .refine(v => v.some(m => m.role === TeamMemberRole.LEADER), {
      message: 'At least one leader is required'
    })
    .refine(v => v.some(m => m.role === TeamMemberRole.MEMBER), {
      message: 'At least one member is required'
    })
})
