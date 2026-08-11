import type { TMaybe } from '.'
import type {
  Task,
  TaskItem,
  TaskTeam,
  TaskUser,
  TaskStatus,
  TaskPriority,
  TaskItemStatus,
  TaskRecurrence,
  TargetFrequency
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

export type TTaskRecurrence = TaskRecurrence

export type TTask = Task & {
  creator?: TMaybe<TUser>
  reviewer?: TMaybe<TUser>
  submitter?: TMaybe<TUser>
  attachable?: TMaybe<TAttachable>
  items?: TTaskItem[]
  users?: TTaskUser[]
  teams?: TTaskTeam[]
  recurrence?: TMaybe<TTaskRecurrence>
  parent?: TMaybe<
    Pick<Task, 'id' | 'name' | 'kind'> & {
      recurrence?: TMaybe<TTaskRecurrence>
    }
  >
}

export type TTaskStatus = TaskStatus
export type TTaskPriority = TaskPriority
export type TTaskItemStatus = TaskItemStatus
export type TTargetFrequency = TargetFrequency
