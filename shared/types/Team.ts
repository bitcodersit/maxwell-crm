import type { Team } from '~~/prisma/client/client'
import type { TTeamMember } from './TeamMember'

export type TTeam = Team &
  Partial<{
    members: TTeamMember[]
  }>
