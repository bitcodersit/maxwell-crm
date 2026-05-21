import { parseDate } from '@internationalized/date'
import { format } from 'date-fns'

type TOptions = {
  formatStr?: string
  returnType?: 'default' | 'display' | 'storage' | 'dateValue'
}

export const calendarFormatDate = (
  date: TMaybe<any | any[] | { start: any; end: any }>,
  options?: TOptions
) => {
  const { formatStr = 'MMM dd yyyy', returnType = 'default' } = options ?? {}
  if (!date) return undefined
  if (Array.isArray(date)) {
    const v = date.map(d => {
      if (returnType === 'dateValue') return parseDate(d)
      if (returnType === 'storage') return d.toString()
      return format(d.toString(), formatStr)
    })
    return returnType === 'display' ? v.join(',') : v
  }
  if (typeof date === 'object' && 'start' in date) {
    if (returnType === 'storage') {
      return {
        start: date.start?.toString(),
        end: date.end?.toString()
      }
    }
    if (returnType === 'dateValue') {
      return {
        start: parseDate(date.start),
        end: parseDate(date.end || date.start)
      }
    }
    const v = [date.start, date.end].filter(Boolean).map((d: any) => {
      return format(d.toString(), formatStr)
    })
    return returnType === 'display' ? v.join(' to ') : v.join('::')
  }
  if (returnType === 'dateValue') return parseDate(date)
  if (returnType === 'storage') return date.toString()
  return format(date.toString(), formatStr)
}

export const calendarFormatDates = <T extends object>(
  data: T,
  fields: (keyof T)[],
  options?: TOptions
) => {
  return fields.reduce(
    (acc, property) => ({
      ...acc,
      [property]: calendarFormatDate(data[property], options)
    }),
    data
  )
}
