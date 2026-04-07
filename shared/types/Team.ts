import type { Team } from '~~/prisma/client/client'
import type { TTeamMember } from './TeamMember'
import type { TUser } from './User'

export type TTeam = Team &
  Partial<{
    creator: TUser
    members: TTeamMember[]
  }>
