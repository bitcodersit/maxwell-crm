import { capitalize } from 'vue'
import { TaskStatus } from '~~/prisma/client/client'

export default defineEventHandler(() => {
  return toPaginated(
    Object.values(TaskStatus).map(status => ({
      id: status,
      name: capitalize(status.split('_').join(' ').toLowerCase())
    }))
  )
})
