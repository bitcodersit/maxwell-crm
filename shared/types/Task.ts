import type { Task, TaskItem, TaskTeam, TaskUser } from '~~/prisma/client/client'
import type { TMaybe } from '.'

export type TTaskItem = TaskItem & {
  task?: TMaybe<TTask>
  completedBy?: TMaybe<TUser>
}

export type TTaskUser = TaskUser & {
  task?: TMaybe<TTask>
  user?: TMaybe<TUser>
}

export type TTaskTeam = TaskTeam & {
  task?: TMaybe<TTask>
  team?: TMaybe<TTeam>
}

export type TTask = Task & {
  creator?: TMaybe<TUser>
  reviewer?: TMaybe<TUser>
  items?: TTaskItem[]
  users?: TTaskUser[]
  teams?: TTaskTeam[]
  attachables?: TAttachable[]
}
