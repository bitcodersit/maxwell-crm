import type { TeamMember } from '~~/prisma/client/client'
import type { TTeam } from './Team'
import type { TUser } from './User'

export type TTeamMember = TeamMember &
  Partial<{
    team: TTeam
    user: TUser
    assigner: TUser
  }>
