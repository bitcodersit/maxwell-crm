import type { Assignable, AssignableUser, AssignableTeam } from '~~/prisma/client/client'

export type TAssignable = Assignable & {
  leads: TMaybe<TLead[]>
  properties: TMaybe<TProperty[]>
  users: TMaybe<TAssignableUser[]>
  teams: TMaybe<TAssignableTeam[]>
}

export type TAssignableUser = AssignableUser & {
  assignable: TMaybe<TAssignable>
  user: TMaybe<TUser>
  assigner: TMaybe<TUser>
}

export type TAssignableTeam = AssignableTeam & {
  assignable: TMaybe<TAssignable>
  team: TMaybe<TTeam>
  assigner: TMaybe<TUser>
}
