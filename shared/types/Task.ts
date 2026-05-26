import type { TMaybe } from '.'
import type {
  Task,
  TaskItem,
  TaskTeam,
  TaskUser,
  TaskStatus,
  TaskPriority,
  TaskItemStatus
} from '~~/prisma/client/client'

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
  submitter?: TMaybe<TUser>
  attachable?: TMaybe<TAttachable>
  items?: TTaskItem[]
  users?: TTaskUser[]
  teams?: TTaskTeam[]
}

export type TTaskStatus = TaskStatus
export type TTaskPriority = TaskPriority
export type TTaskItemStatus = TaskItemStatus
