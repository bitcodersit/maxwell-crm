import { getLocalTimeZone, today } from '@internationalized/date'
import { format } from 'date-fns'

/**
 *
 * Date column formatter to display in a table column like createdAt or updatedAt
 */
export const $dfc = (
  value: unknown,
  formatStr: string = 'MMM d, yyyy h:mm a',
  fallback: string = '—'
) => {
  if (!value) return fallback
  const date = new Date(value as string | number | Date)
  if (Number.isNaN(date.getTime())) return fallback
  return format(date, formatStr)
}

export const todayDateValue = () => {
  return today(getLocalTimeZone())
}

/** Format a date for `<input type="datetime-local">` in the user's local timezone. */
export const toDatetimeLocalValue = (value: unknown) => {
  if (!value) return ''
  const date = new Date(value as string | number | Date)
  if (Number.isNaN(date.getTime())) return ''
  const offset = date.getTimezoneOffset()
  const local = new Date(date.getTime() - offset * 60_000)
  return local.toISOString().slice(0, 16)
}
