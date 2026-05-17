import { capitalize } from 'vue'
import { TaskPriority, TaskStatus } from '~~/prisma/client/enums'

const allowedStatuses: TaskStatus[] = [
  TaskStatus.TODO,
  TaskStatus.IN_PROGRESS,
  TaskStatus.IN_REVIEW
]

export const useTaskStatusItems = (onSelect?: (value: TaskStatus) => void) => {
  const { user } = useUserSession()
  return computed(() => {
    const values = Object.values(TaskStatus)
    return (
      user.value?.updateAnyTasks ? values : values.filter(v => allowedStatuses.includes(v))
    ).map(value => ({
      value,
      label: capitalize(value.split('_').join(' ').toLowerCase()),
      onSelect() {
        onSelect?.(value)
      }
    }))
  })
}

const allowedPriorities: TaskPriority[] = []
export const useTaskPriorityItems = (onSelect?: (value: TaskPriority) => void) => {
  const { user } = useUserSession()
  return computed(() => {
    const values = Object.values(TaskPriority)
    return (
      user.value?.updateAnyTasks ? values : values.filter(v => allowedPriorities.includes(v))
    ).map(value => ({
      value,
      label: capitalize(value.split('_').join(' ').toLowerCase()),
      onSelect() {
        onSelect?.(value)
      }
    }))
  })
}
