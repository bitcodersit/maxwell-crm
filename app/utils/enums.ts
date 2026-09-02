import { capitalize } from 'vue'
import { LeadStatus, TargetFrequency, TargetStatus, TaskPriority, TaskStatus } from '~~/prisma/client/enums'

const allowedStatuses: TaskStatus[] = [
  TaskStatus.TODO,
  TaskStatus.IN_PROGRESS,
  TaskStatus.IN_REVIEW
]

export const useTaskStatusItems = (onSelect?: (value: TaskStatus) => void) => {
  const { user } = useCurrentUser()
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
  const { user } = useCurrentUser()
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

const allowedTargetStatuses: TargetStatus[] = [
  TargetStatus.RUNNING,
  TargetStatus.PAUSED,
  TargetStatus.SKIPPED
]

export const useTargetStatusItems = (onSelect?: (value: TargetStatus) => void) => {
  const { user } = useCurrentUser()
  return computed(() => {
    const values = Object.values(TargetStatus)
    return (
      user.value?.updateAnyTargets
        ? values
        : values.filter(v => allowedTargetStatuses.includes(v))
    ).map(value => ({
      value,
      label: capitalize(value.split('_').join(' ').toLowerCase()),
      onSelect() {
        onSelect?.(value)
      }
    }))
  })
}

export const useTargetPriorityItems = (onSelect?: (value: TaskPriority) => void) => {
  const { user } = useCurrentUser()
  return computed(() => {
    const values = Object.values(TaskPriority)
    return (
      user.value?.updateAnyTargets ? values : values.filter(v => allowedPriorities.includes(v))
    ).map(value => ({
      value,
      label: capitalize(value.split('_').join(' ').toLowerCase()),
      onSelect() {
        onSelect?.(value)
      }
    }))
  })
}

export const useTargetFrequencyItems = (onSelect?: (value: TargetFrequency) => void) => {
  return computed(() => {
    return Object.values(TargetFrequency).map(value => ({
      value,
      label: capitalize(value.split('_').join(' ').toLowerCase()),
      onSelect() {
        onSelect?.(value)
      }
    }))
  })
}

export const useLeadStatusItems = (onSelect?: (value: LeadStatus) => void) => {
  return computed(() => {
    return Object.values(LeadStatus).map(value => ({
      value,
      label: capitalize(value.split('_').join(' ').toLowerCase()),
      onSelect() {
        onSelect?.(value)
      }
    }))
  })
}
