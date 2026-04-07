import { TeamMemberRole } from '~~/prisma/client/enums'

const zTeam = z.object({
  id: z.number().nullish(),
  name: z.string().min(1),
  description: z.string().nullish(),
  members: z
    .array(
      z.object({
        userId: z.number(),
        role: z.enum(TeamMemberRole).default(TeamMemberRole.MEMBER),
      })
    )
    .nullish(),
})

export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event)

  const body = await readBody(event)
  const input = await validate(body, zTeam)

  try {
    if (input.id) {
      if (!can(session, ['update-any-team'])) {
        if (!can(session, ['update-own-team'])) {
          throw err.denied()
        }
        const isTeamLeader = await prisma.teamMember.findFirst({
          where: {
            teamId: input.id,
            userId: session.user.id,
            role: TeamMemberRole.LEADER,
          },
          select: {
            id: true,
          },
        })
        if (!isTeamLeader) {
          throw err.denied()
        }
      }
      const team = await prisma.team.update({
        where: {
          id: input.id,
        },
        data: {
          name: input.name,
          description: input.description,
          members: input.members?.length
            ? {
                deleteMany: {
                  userId: {
                    notIn: input.members.map((member) => member.userId),
                  },
                },
                upsert: input.members.map((member) => ({
                  where: {
                    teamId_userId: {
                      teamId: input.id!,
                      userId: member.userId,
                    },
                  },
                  update: {
                    role: member.role,
                  },
                  create: {
                    role: member.role,
                    userId: member.userId,
                    assignerId: session.user.id,
                  },
                })),
              }
            : undefined,
        },
        include: {
          creator: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          members: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
              assigner: {
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
      return team
    }

    if (!can(session, ['create-any-team'])) {
      throw err.denied()
    }

    const team = await prisma.team.create({
      data: {
        name: input.name,
        creatorId: session.user.id,
        description: input.description,
        members: {
          createMany: {
            data: (input.members || []).map((member) => ({
              userId: member.userId,
              role: member.role,
            })),
          },
        },
      },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        members: {
          include: {
            user: true,
            assigner: {
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
    return team
  } catch (error: any) {
    const message = error.message || ''
    if (message.includes('not found')) throw err.notFound()
    if (message.includes('teams_name_key')) {
      throw err.unprocessable({
        name: {
          errors: ['Name is already taken, please try a different name'],
        },
      })
    }
    throw error
  }
})
