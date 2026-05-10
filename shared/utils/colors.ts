import { TaskStatus, TaskPriority } from '~~/prisma/client/enums'

export const ColorsMap = {
  create: 'success',
  read: 'primary',
  update: 'warning',
  delete: 'error',
  export: 'neutral',
  any: 'error',
  own: 'warning',
  'Super Admin': 'primary',
  Admin: 'success',
  Manager: 'warning',
  Salesman: 'secondary',
  Accountant: 'error',
  [TaskStatus.TODO]: 'neutral',
  [TaskStatus.IN_PROGRESS]: 'primary',
  [TaskStatus.IN_REVIEW]: 'warning',
  [TaskStatus.COMPLETED]: 'success',
  [TaskStatus.CANCELLED]: 'error',
  [TaskPriority.URGENT]: 'error',
  [TaskPriority.HIGH]: 'warning',
  [TaskPriority.MEDIUM]: 'neutral',
  [TaskPriority.LOW]: 'neutral'
} as const
