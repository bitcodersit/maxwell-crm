import type { CalendarProps } from '@nuxt/ui'
import { format } from 'date-fns'

export const calendarFormatDate = (
  date: TMaybe<CalendarProps['modelValue']>,
  v?: {
    formatStr?: string
    returnType?: 'default' | 'display'
  }
) => {
  const { formatStr = 'MMM dd yyyy', returnType = 'default' } = v ?? {}
  if (!date) return undefined
  if (Array.isArray(date)) {
    const v = date.map((d) => format(d.toString(), formatStr))
    return returnType === 'display' ? v.join(',') : v
  }
  if (typeof date === 'object' && 'start' in date && 'end' in date) {
    const v = [date.start, date.end].map((d: any) => format(d.toString(), formatStr))
    return returnType === 'display' ? v.join(' to ') : v.join(',')
  }
  return format(date.toString(), formatStr)
}
