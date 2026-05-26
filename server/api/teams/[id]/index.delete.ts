import { TeamMemberRole } from '~~/prisma/client/enums'

export default defineEventHandler(async event => {
  try {
    const user = await getCurrentUser(event)

    const idParam = getRouterParam(event, 'id')
    const ids = (idParam || '')
      .split(',')
      .map(s => Number(s.trim()))
      .filter(n => Number.isInteger(n) && n > 0)

    if (ids.length === 0) {
      throw err.notFound()
    }

    const canDeleteAny = !!user.deleteAnyTeams
    const canDeleteOwn = !!user.deleteOwnTeams

    if (!canDeleteAny && !canDeleteOwn) {
      throw err.denied()
    }

    if (canDeleteAny) {
      const data = await prisma.team.updateMany({
        where: {
          id: {
            in: ids
          }
        },
        data: {
          deletedAt: new Date()
        }
      })
      return {
        message: 'Team deleted successfully',
        data
      }
    }

    const uniqueIds = [...new Set(ids)]
    const leaderMemberships = await prisma.teamMember.findMany({
      where: {
        userId: user.id,
        role: TeamMemberRole.LEADER,
        teamId: { in: uniqueIds }
      },
      select: {
        teamId: true
      }
    })
    const leaderTeamIds = new Set(leaderMemberships.map(m => m.teamId))

    const success: number[] = []
    const skipped: { id: number; error: string }[] = []

    for (const teamId of uniqueIds) {
      if (!leaderTeamIds.has(teamId)) {
        skipped.push({ id: teamId, error: 'not a team leader' })
        continue
      }
      const { count } = await prisma.team.updateMany({
        where: {
          id: teamId,
          deletedAt: null
        },
        data: {
          deletedAt: new Date()
        }
      })
      if (count > 0) {
        success.push(teamId)
      } else {
        skipped.push({
          id: teamId,
          error: 'team not found or already deleted'
        })
      }
    }

    return {
      message: 'Team delete completed',
      success,
      skipped
    }
  } catch (error: any) {
    if (error.message.includes('not found')) throw err.notFound()
    throw error
  }
})
