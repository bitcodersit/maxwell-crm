import { capitalize } from 'vue'
import { TargetStatus } from '~~/prisma/client/client'

export default defineEventHandler(() => {
  return toPaginated(
    Object.values(TargetStatus).map(status => ({
      id: status,
      name: capitalize(status.split('_').join(' ').toLowerCase())
    }))
  )
})
