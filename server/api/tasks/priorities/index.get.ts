import { capitalize } from 'vue'
import { TaskPriority } from '~~/prisma/client/client'

export default defineEventHandler(() => {
  return toPaginated(
    Object.values(TaskPriority).map(priority => ({
      id: priority,
      name: capitalize(priority.split('_').join(' ').toLowerCase())
    }))
  )
})
