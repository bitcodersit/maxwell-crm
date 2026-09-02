import { parseISO, startOfDay } from 'date-fns'
import { canReadTargets, ensureTargetOccurrences } from '~~/server/utils/targets'
import {
  getPeriodWindows,
  getTargetOccurrenceBaseWhere,
  rankAssignees,
  rankTeams,
  targetOccurrenceSelect
} from '~~/server/utils/targetStats'

const parseDateParam = (value: unknown) => {
  if (!value) return null
  const raw = Array.isArray(value) ? value[0] : value
  if (typeof raw !== 'string' || !raw.trim()) return null
  const date = parseISO(raw)
  return Number.isNaN(date.getTime()) ? null : startOfDay(date)
}

export default defineEventHandler(async event => {
  const user = await getCurrentUser(event)
  if (!canReadTargets(user)) {
    throw err.denied()
  }

  await ensureTargetOccurrences(user.id)

  const query = getQuery(event)
  const group = query.group === 'teams' ? 'teams' : 'users'
  const period = query.period === 'week' ? 'week' : query.period === 'custom' ? 'custom' : 'month'
  const windows = getPeriodWindows()

  let rangeStart = windows.month.rangeStart
  let rangeEnd = windows.month.rangeEnd
  if (period === 'week') {
    rangeStart = windows.week.rangeStart
    rangeEnd = windows.week.rangeEnd
  } else if (period === 'custom') {
    rangeStart = parseDateParam(query.from) || rangeStart
    rangeEnd = parseDateParam(query.to) || rangeEnd
  }

  const rows = await prisma.task.findMany({
    where: getTargetOccurrenceBaseWhere(user),
    select: targetOccurrenceSelect
  })

  const ranked =
    group === 'teams'
      ? rankTeams(rows, { rangeStart, rangeEnd }).map((row, index) => ({
          rank: index + 1,
          ...row
        }))
      : rankAssignees(rows, { rangeStart, rangeEnd }).map((row, index) => ({
          rank: index + 1,
          ...row
        }))

  return {
    period,
    group,
    rangeStart,
    rangeEnd,
    data: ranked.map(({ fillUpSum: _s, fillUpCount: _c, ...rest }) => rest)
  }
})
