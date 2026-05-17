// @ts-nocheck
import {
  addDays,
  addMonths,
  isAfter,
  isBefore,
  isEqual,
  startOfMonth,
  startOfWeek,
  startOfDay
} from 'date-fns'
import { TaskStatus } from '~~/prisma/client/client'

const getTaskScopedWhere = (user, where) => {
  if (user.readAnyTasks) return where
  return {
    AND: [
      where,
      {
        OR: [
          { creatorId: user.id },
          { reviewerId: user.id },
          { submitterId: user.id },
          { users: { some: { userId: user.id } } },
          {
            teams: {
              some: {
                team: {
                  members: {
                    some: {
                      userId: user.id
                    }
                  }
                }
              }
            }
          }
        ]
      }
    ]
  }
}

const isBeforeOrEqual = (date, dateToCompare) => {
  const d1 = startOfDay(date)
  const d2 = startOfDay(dateToCompare)
  return isBefore(d1, d2) || isEqual(d1, d2)
}

const isBeforeDay = (date, dateToCompare) => {
  const d1 = startOfDay(date)
  const d2 = startOfDay(dateToCompare)
  return isBefore(d1, d2)
}

const toPercent = (num, den) => (den > 0 ? Math.round((num / den) * 100) : 0)
const toDeltaPercent = (current, previous) => {
  if (!previous) return current > 0 ? 100 : 0
  return Math.round(((current - previous) / previous) * 100)
}
const toRateDelta = (currentRate, previousRate) =>
  Math.round((currentRate - previousRate) * 10) / 10
const isInRange = (value, start, endExclusive) => {
  const dValue = startOfDay(value)
  const dStart = startOfDay(start)
  const dEnd = startOfDay(endExclusive)
  return (isEqual(dValue, dStart) || isAfter(dValue, dStart)) && isBefore(dValue, dEnd)
}

export default defineEventHandler(async event => {
  const { user } = await requireUserSession(event)
  if (!user.readAnyTasks || !user.readOwnTasks) {
    throw err.denied()
  }

  const where = getTaskScopedWhere(user, { deletedAt: null })

  const now = new Date()
  const currentWeekStart = startOfWeek(now, { weekStartsOn: 1 })
  const nextWeekStart = addDays(currentWeekStart, 7)
  const previousWeekStart = addDays(currentWeekStart, -7)
  const currentMonthStart = startOfMonth(now)
  const nextMonthStart = addMonths(currentMonthStart, 1)
  const previousMonthStart = addMonths(currentMonthStart, -1)

  const [summaryTasks, periodTasks] = await prisma.$transaction([
    prisma.task.findMany({
      where,
      select: {
        status: true,
        dueAt: true,
        reviewedAt: true,
        submittedAt: true
      }
    }),
    prisma.task.findMany({
      where: {
        AND: [
          where,
          {
            OR: [
              { createdAt: { gte: previousMonthStart } },
              { reviewedAt: { gte: previousMonthStart } }
            ]
          }
        ]
      },
      select: {
        status: true,
        createdAt: true,
        reviewedAt: true
      }
    })
  ])

  const statusCounts = {}
  let goalEligible = 0
  let goalHit = 0
  let goalFail = 0

  for (const task of summaryTasks) {
    statusCounts[task.status] = (statusCounts[task.status] || 0) + 1

    if (task.status !== TaskStatus.CANCELLED && task.dueAt) {
      goalEligible++

      const isGoalHit =
        task.status === TaskStatus.COMPLETED &&
        (user.readAnyTasks
          ? task.reviewedAt && isBeforeOrEqual(task.reviewedAt, task.dueAt)
          : !!task.submittedAt)
      if (isGoalHit) goalHit++

      const isGoalFail =
        task.status === TaskStatus.FAILED ||
        (task.status !== TaskStatus.COMPLETED && isBeforeDay(task.dueAt, now))
      if (isGoalFail) goalFail++
    }
  }
  const total = summaryTasks.length
  const todo = statusCounts[TaskStatus.TODO] ?? 0
  const inReview = statusCounts[TaskStatus.IN_REVIEW] ?? 0
  const failed = statusCounts[TaskStatus.FAILED] ?? 0
  const cancelled = statusCounts[TaskStatus.CANCELLED] ?? 0
  const inProgress = statusCounts[TaskStatus.IN_PROGRESS] ?? 0
  const completed = statusCounts[TaskStatus.COMPLETED] ?? 0
  const goalHitRate = toPercent(goalHit, goalEligible)
  const goalFailRate = toPercent(goalFail, goalEligible)

  let currentWeekCreated = 0
  let previousWeekCreated = 0
  let currentMonthCreated = 0
  let previousMonthCreated = 0
  let currentWeekCompleted = 0
  let previousWeekCompleted = 0
  let currentMonthCompleted = 0
  let previousMonthCompleted = 0

  for (const task of periodTasks) {
    const createdAt = task.createdAt
    const reviewedAt = task.status === TaskStatus.COMPLETED ? task.reviewedAt : null

    if (isInRange(createdAt, currentWeekStart, nextWeekStart)) currentWeekCreated++
    else if (isInRange(createdAt, previousWeekStart, currentWeekStart)) previousWeekCreated++

    if (isInRange(createdAt, currentMonthStart, nextMonthStart)) currentMonthCreated++
    else if (isInRange(createdAt, previousMonthStart, currentMonthStart)) previousMonthCreated++

    if (reviewedAt) {
      if (isInRange(reviewedAt, currentWeekStart, nextWeekStart)) currentWeekCompleted++
      else if (isInRange(reviewedAt, previousWeekStart, currentWeekStart)) previousWeekCompleted++

      if (isInRange(reviewedAt, currentMonthStart, nextMonthStart)) currentMonthCompleted++
      else if (isInRange(reviewedAt, previousMonthStart, currentMonthStart))
        previousMonthCompleted++
    }
  }

  const weeklyRate = toPercent(currentWeekCompleted, currentWeekCreated)
  const previousWeeklyRate = toPercent(previousWeekCompleted, previousWeekCreated)
  const monthlyRate = toPercent(currentMonthCompleted, currentMonthCreated)
  const previousMonthlyRate = toPercent(previousMonthCompleted, previousMonthCreated)

  return {
    summary: {
      total,
      todo,
      inReview,
      failed,
      cancelled,
      inProgress,
      completed,
      goalEligible,
      goalHit,
      goalFail,
      goalHitRate,
      goalFailRate
    },
    weekly: {
      done: currentWeekCompleted,
      total: currentWeekCreated,
      remaining: Math.max(currentWeekCreated - currentWeekCompleted, 0),
      percent: weeklyRate,
      changePercent: toRateDelta(weeklyRate, previousWeeklyRate),
      volumeChangePercent: toDeltaPercent(currentWeekCreated, previousWeekCreated)
    },
    monthly: {
      completed: currentMonthCompleted,
      target: currentMonthCreated,
      remaining: Math.max(currentMonthCreated - currentMonthCompleted, 0),
      percent: monthlyRate,
      changePercent: toRateDelta(monthlyRate, previousMonthlyRate),
      volumeChangePercent: toDeltaPercent(currentMonthCreated, previousMonthCreated)
    },
    trends: {
      completedWeekOverWeek: toDeltaPercent(currentWeekCompleted, previousWeekCompleted),
      completedMonthOverMonth: toDeltaPercent(currentMonthCompleted, previousMonthCompleted)
    }
  }
})
