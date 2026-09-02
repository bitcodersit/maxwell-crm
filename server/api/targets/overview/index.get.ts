import { startOfDay } from 'date-fns'
import { TargetStatus } from '~~/prisma/client/enums'
import { canReadTargets, ensureTargetOccurrences } from '~~/server/utils/targets'
import {
  getPeriodWindows,
  getTargetOccurrenceBaseWhere,
  inPeriod,
  rankAssignees,
  summarizePeriod,
  targetOccurrenceSelect
} from '~~/server/utils/targetStats'
import {
  getTargetFillUp,
  isCurrentTargetWindow,
  isTargetSeriesEndStatus
} from '~~/shared/utils/targetWindows'

const toPercent = (num: number, den: number) => (den > 0 ? Math.round((num / den) * 100) : 0)

export default defineEventHandler(async event => {
  const user = await getCurrentUser(event)
  if (!canReadTargets(user)) {
    throw err.denied()
  }

  await ensureTargetOccurrences(user.id)

  const { now, week, month } = getPeriodWindows()
  const rows = await prisma.task.findMany({
    where: getTargetOccurrenceBaseWhere(user),
    select: targetOccurrenceSelect
  })

  let running = 0
  let paused = 0
  let upcoming = 0
  let fillUpSum = 0
  let fillUpCount = 0
  let achievedMonth = 0
  let missedMonth = 0
  let skippedMonth = 0

  for (const row of rows) {
    const inCurrent = isCurrentTargetWindow(row.startsAt, row.dueAt, now)
    if (inCurrent && row.targetStatus === TargetStatus.RUNNING) running++
    if (inCurrent && row.targetStatus === TargetStatus.PAUSED) paused++
    if (
      row.targetStatus === TargetStatus.NEW &&
      row.startsAt &&
      startOfDay(row.startsAt) > startOfDay(now)
    ) {
      upcoming++
    }

    if (inCurrent && row.targetStatus === TargetStatus.RUNNING) {
      fillUpSum += getTargetFillUp(row.items).fillUpPercent
      fillUpCount++
    }

    if (inPeriod(row, month) && !isTargetSeriesEndStatus(row.targetStatus)) {
      if (row.targetStatus === TargetStatus.ACHIEVED) achievedMonth++
      if (row.targetStatus === TargetStatus.MISSED) missedMonth++
      if (row.targetStatus === TargetStatus.SKIPPED) skippedMonth++
    }
  }

  const hitEligible = achievedMonth + missedMonth
  const hitRate = toPercent(achievedMonth, hitEligible)
  const missRate = toPercent(missedMonth, hitEligible)

  return {
    summary: {
      running,
      paused,
      new: upcoming,
      achievedMonth,
      missedMonth,
      skippedMonth,
      fillUpPercent: fillUpCount ? Math.round(fillUpSum / fillUpCount) : 0,
      hitRate,
      missRate,
      hitEligible
    },
    weekly: summarizePeriod(rows, week),
    monthly: summarizePeriod(rows, month),
    performers: rankAssignees(rows, month)
      .slice(0, 5)
      .map(({ fillUpSum: _s, fillUpCount: _c, ...rest }) => rest)
  }
})
