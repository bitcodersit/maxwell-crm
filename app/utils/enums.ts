import { TaskPriority, TaskStatus } from '~~/prisma/client/enums'

export const getTaskStatusItems = (onSelect?: (value: TaskStatus) => void) => {
  return Object.values(TaskStatus).map(value => ({
    value,
    label: value,
    onSelect() {
      onSelect?.(value)
    }
  }))
}

export const getTaskPriorityItems = (onSelect?: (value: TaskPriority) => void) => {
  return Object.values(TaskPriority).map(value => ({
    value,
    label: value,
    onSelect() {
      onSelect?.(value)
    }
  }))
}
