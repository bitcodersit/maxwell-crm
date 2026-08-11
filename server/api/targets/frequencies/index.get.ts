import { capitalize } from 'vue'
import { TargetFrequency } from '~~/prisma/client/client'

export default defineEventHandler(() => {
  return toPaginated(
    Object.values(TargetFrequency).map(frequency => ({
      id: frequency,
      name: capitalize(frequency.split('_').join(' ').toLowerCase())
    }))
  )
})
