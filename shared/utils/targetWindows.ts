import {
  addDays,
  addMonths,
  differenceInCalendarDays,
  endOfMonth,
  startOfDay,
  startOfMonth,
  startOfWeek
} from 'date-fns'
import { TargetFrequency, TargetStatus, TaskItemStatus } from '~~/prisma/client/enums'

export const TARGET_OPEN_STATUSES: TargetStatus[] = [
  TargetStatus.NEW,
  TargetStatus.RUNNING,
  TargetStatus.PAUSED
]

export const TARGET_SERIES_END_STATUSES: TargetStatus[] = [
  TargetStatus.STOPPED,
  TargetStatus.CANCELLED
]

export const TARGET_CYCLE_SKIP_STATUSES: TargetStatus[] = [TargetStatus.SKIPPED]

export const isTargetSeriesEndStatus = (status?: TargetStatus | null) =>
  !!status && TARGET_SERIES_END_STATUSES.includes(status)

export const startOfBusinessWeek = (date: Date) => startOfWeek(startOfDay(date), { weekStartsOn: 6 })

export const getWeeklyWindow = (date: Date) => {
  const today = startOfDay(date)
  // Friday sits outside Sat–Thu; use the next Saturday–Thursday
  if (today.getDay() === 5) {
    const rangeStart = addDays(today, 1)
    return { rangeStart, rangeEnd: addDays(rangeStart, 5) }
  }
  const rangeStart = startOfBusinessWeek(today)
  return { rangeStart, rangeEnd: addDays(rangeStart, 5) }
}

export const getMonthlyWindow = (date: Date) => {
  const rangeStart = startOfMonth(startOfDay(date))
  return { rangeStart, rangeEnd: startOfDay(endOfMonth(rangeStart)) }
}

export const getWindowForFrequency = (frequency: TargetFrequency, date = new Date()) => {
  if (frequency === TargetFrequency.WEEKLY) return getWeeklyWindow(date)
  if (frequency === TargetFrequency.MONTHLY) return getMonthlyWindow(date)
  const rangeStart = startOfDay(date)
  return { rangeStart, rangeEnd: addDays(rangeStart, 6) }
}

export const advanceTargetWindow = (input: {
  frequency: TargetFrequency
  rangeStart: Date
  rangeEnd: Date
  intervalDays?: number | null
}) => {
  const rangeStart = startOfDay(input.rangeStart)
  const rangeEnd = startOfDay(input.rangeEnd)

  if (input.frequency === TargetFrequency.MONTHLY) {
    const nextStart = startOfMonth(addMonths(rangeStart, 1))
    return { rangeStart: nextStart, rangeEnd: startOfDay(endOfMonth(nextStart)) }
  }

  if (input.frequency === TargetFrequency.WEEKLY) {
    return {
      rangeStart: addDays(rangeStart, 7),
      rangeEnd: addDays(rangeEnd, 7)
    }
  }

  const duration = Math.max(differenceInCalendarDays(rangeEnd, rangeStart) + 1, input.intervalDays || 1)
  const nextStart = addDays(rangeEnd, 1)
  return {
    rangeStart: nextStart,
    rangeEnd: addDays(nextStart, duration - 1)
  }
}

export const getOpenTargetStatusForWindow = (startsAt: Date, dueAt: Date, now = new Date()) => {
  const today = startOfDay(now)
  const start = startOfDay(startsAt)
  const end = startOfDay(dueAt)
  if (today < start) return TargetStatus.NEW
  if (today > end) return TargetStatus.MISSED
  return TargetStatus.RUNNING
}

export const isPastTargetWindow = (dueAt?: Date | string | null, now = new Date()) => {
  if (!dueAt) return false
  return startOfDay(new Date(dueAt)) < startOfDay(now)
}

export const isCurrentTargetWindow = (
  startsAt?: Date | string | null,
  dueAt?: Date | string | null,
  now = new Date()
) => {
  if (!startsAt || !dueAt) return false
  const today = startOfDay(now)
  return startOfDay(new Date(startsAt)) <= today && today <= startOfDay(new Date(dueAt))
}

export const windowsOverlap = (
  startsAt: Date | string | null | undefined,
  dueAt: Date | string | null | undefined,
  periodStart: Date,
  periodEnd: Date
) => {
  if (!startsAt || !dueAt) return false
  const start = startOfDay(new Date(startsAt))
  const end = startOfDay(new Date(dueAt))
  const from = startOfDay(periodStart)
  const to = startOfDay(periodEnd)
  return start <= to && end >= from
}

export const getTargetFillUp = (
  items: { status: TaskItemStatus }[] | null | undefined
) => {
  const list = items || []
  const totalItems = list.length
  const completedItems = list.filter(item => item.status === TaskItemStatus.COMPLETED).length
  const fillUpPercent = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0
  return {
    totalItems,
    completedItems,
    fillUpPercent,
    isFilledUp: totalItems > 0 && completedItems === totalItems
  }
}
