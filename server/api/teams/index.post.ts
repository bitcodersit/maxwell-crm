import { TeamMemberRole } from '~~/prisma/client/enums'

const zTeam = z.object({
  id: z.number().nullish(),
  name: z.string().min(1),
  description: z.string().nullish(),
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
            userId: session.user?.id,
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
        },
        include: {
          members: {
            include: {
              user: true,
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
        description: input.description,
      },
      include: {
        members: {
          include: {
            user: true,
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
