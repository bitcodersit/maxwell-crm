import type { Task, TaskItem, TaskTeam, TaskUser } from '~~/prisma/client/client'

export type TTaskItem = TaskItem & {
  task?: TTask
  completedBy?: TUser
}

export type TTaskUser = TaskUser & {
  task?: TTask
  user?: TUser
}

export type TTaskTeam = TaskTeam & {
  task?: TTask
  team?: TTeam
}

export type TTask = Task & {
  creator?: TUser
  reviewer?: TUser
  items?: TTaskItem[]
  users?: TTaskUser[]
  teams?: TTaskTeam[]
  attachables?: TAttachable[]
}
