import type { Prisma } from '~~/prisma/client/client'
import { startOfDay } from 'date-fns'
import { TargetStatus, TaskItemStatus, TaskKind } from '~~/prisma/client/enums'
import { getTargetFillUp } from '~~/shared/utils/targetWindows'
import {
  getMonthlyWindow,
  getWeeklyWindow,
  isCurrentTargetWindow,
  isTargetSeriesEndStatus,
  windowsOverlap
} from '~~/shared/utils/targetWindows'

export const targetOccurrenceSelect = {
  id: true,
  name: true,
  targetStatus: true,
  startsAt: true,
  dueAt: true,
  items: {
    where: { deletedAt: null },
    select: { status: true }
  },
  users: {
    where: { deletedAt: null },
    select: {
      userId: true,
      user: {
        select: {
          id: true,
          name: true,
          avatar: { select: { path: true } }
        }
      }
    }
  },
  teams: {
    where: { deletedAt: null },
    select: {
      teamId: true,
      team: {
        select: {
          id: true,
          name: true
        }
      }
    }
  }
} as const

export type TTargetStatRow = {
  id: number
  name: string
  targetStatus: TargetStatus | null
  startsAt: Date | null
  dueAt: Date | null
  items: { status: TaskItemStatus }[]
  users: {
    userId: number
    user: { id: number; name: string; avatar: { path: string } | null } | null
  }[]
  teams: {
    teamId: number
    team: { id: number; name: string } | null
  }[]
}

export const getTargetOccurrenceBaseWhere = (user: TUser): Prisma.TaskWhereInput => {
  const where: Prisma.TaskWhereInput = {
    deletedAt: null,
    kind: TaskKind.TARGET,
    parentId: { not: null }
  }
  if (user.readAnyTargets) return where
  return { AND: [where, getTaskOwnScope(user.id)] }
}

export const getPeriodWindows = (now = new Date()) => {
  const week = getWeeklyWindow(now)
  const month = getMonthlyWindow(now)
  return {
    now: startOfDay(now),
    week,
    month
  }
}

export const inPeriod = (
  row: Pick<TTargetStatRow, 'startsAt' | 'dueAt'>,
  period: { rangeStart: Date; rangeEnd: Date }
) => windowsOverlap(row.startsAt, row.dueAt, period.rangeStart, period.rangeEnd)

export const summarizePeriod = (
  rows: TTargetStatRow[],
  period: { rangeStart: Date; rangeEnd: Date }
) => {
  const cycles = rows.filter(
    row => inPeriod(row, period) && !isTargetSeriesEndStatus(row.targetStatus)
  )
  let achieved = 0
  let missed = 0
  let skipped = 0
  let remaining = 0

  for (const cycle of cycles) {
    if (cycle.targetStatus === TargetStatus.ACHIEVED) achieved++
    else if (cycle.targetStatus === TargetStatus.MISSED) missed++
    else if (cycle.targetStatus === TargetStatus.SKIPPED) skipped++
    else remaining++
  }

  const eligible = achieved + missed + remaining
  return {
    achieved,
    missed,
    skipped,
    remaining,
    total: cycles.length,
    percent: eligible > 0 ? Math.round((achieved / eligible) * 100) : 0
  }
}

const toPercent = (num: number, den: number) => (den > 0 ? Math.round((num / den) * 100) : 0)

type TPerformer = {
  userId: number
  name: string
  avatar: { path: string } | null
  assigned: number
  achieved: number
  missed: number
  skipped: number
  active: number
  fillUpSum: number
  fillUpCount: number
  hitRate: number
  fillUpPercent: number
}

const emptyPerformer = (
  userId: number,
  name: string,
  avatar: { path: string } | null
): TPerformer => ({
  userId,
  name,
  avatar,
  assigned: 0,
  achieved: 0,
  missed: 0,
  skipped: 0,
  active: 0,
  fillUpSum: 0,
  fillUpCount: 0,
  hitRate: 0,
  fillUpPercent: 0
})

export const rankAssignees = (
  rows: TTargetStatRow[],
  period: { rangeStart: Date; rangeEnd: Date }
) => {
  const now = new Date()
  const map = new Map<number, TPerformer>()

  for (const row of rows) {
    if (!inPeriod(row, period) || isTargetSeriesEndStatus(row.targetStatus)) continue
    const fillUp = getTargetFillUp(row.items)
    const isActive =
      isCurrentTargetWindow(row.startsAt, row.dueAt, now) &&
      (row.targetStatus === TargetStatus.RUNNING || row.targetStatus === TargetStatus.PAUSED)

    for (const assignment of row.users) {
      const user = assignment.user
      if (!user) continue
      const performer = map.get(user.id) || emptyPerformer(user.id, user.name, user.avatar)
      performer.assigned++
      if (row.targetStatus === TargetStatus.ACHIEVED) performer.achieved++
      if (row.targetStatus === TargetStatus.MISSED) performer.missed++
      if (row.targetStatus === TargetStatus.SKIPPED) performer.skipped++
      if (isActive) performer.active++
      performer.fillUpSum += fillUp.fillUpPercent
      performer.fillUpCount++
      map.set(user.id, performer)
    }
  }

  return [...map.values()]
    .map(performer => ({
      ...performer,
      hitRate: toPercent(performer.achieved, performer.achieved + performer.missed),
      fillUpPercent: performer.fillUpCount
        ? Math.round(performer.fillUpSum / performer.fillUpCount)
        : 0
    }))
    .sort((a, b) => b.hitRate - a.hitRate || b.achieved - a.achieved || b.assigned - a.assigned)
}

type TTeamPerformer = {
  teamId: number
  name: string
  assigned: number
  achieved: number
  missed: number
  skipped: number
  active: number
  fillUpSum: number
  fillUpCount: number
  hitRate: number
  fillUpPercent: number
}

export const rankTeams = (rows: TTargetStatRow[], period: { rangeStart: Date; rangeEnd: Date }) => {
  const now = new Date()
  const map = new Map<number, TTeamPerformer>()

  for (const row of rows) {
    if (!inPeriod(row, period) || isTargetSeriesEndStatus(row.targetStatus)) continue
    const fillUp = getTargetFillUp(row.items)
    const isActive =
      isCurrentTargetWindow(row.startsAt, row.dueAt, now) &&
      (row.targetStatus === TargetStatus.RUNNING || row.targetStatus === TargetStatus.PAUSED)

    for (const assignment of row.teams) {
      const team = assignment.team
      if (!team) continue
      const performer = map.get(team.id) || {
        teamId: team.id,
        name: team.name,
        assigned: 0,
        achieved: 0,
        missed: 0,
        skipped: 0,
        active: 0,
        fillUpSum: 0,
        fillUpCount: 0,
        hitRate: 0,
        fillUpPercent: 0
      }
      performer.assigned++
      if (row.targetStatus === TargetStatus.ACHIEVED) performer.achieved++
      if (row.targetStatus === TargetStatus.MISSED) performer.missed++
      if (row.targetStatus === TargetStatus.SKIPPED) performer.skipped++
      if (isActive) performer.active++
      performer.fillUpSum += fillUp.fillUpPercent
      performer.fillUpCount++
      map.set(team.id, performer)
    }
  }

  return [...map.values()]
    .map(performer => ({
      ...performer,
      hitRate: toPercent(performer.achieved, performer.achieved + performer.missed),
      fillUpPercent: performer.fillUpCount
        ? Math.round(performer.fillUpSum / performer.fillUpCount)
        : 0
    }))
    .sort((a, b) => b.hitRate - a.hitRate || b.achieved - a.achieved || b.assigned - a.assigned)
}
