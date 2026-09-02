import 'dotenv/config'
import { addDays, addMonths, endOfMonth, startOfDay, startOfMonth, startOfWeek } from 'date-fns'
import { PrismaMariaDb } from '@prisma/adapter-mariadb'
import { PrismaClient } from './client/client'
import {
  TargetFrequency,
  TargetStatus,
  TaskItemStatus,
  TaskKind,
  TaskPriority,
  TaskStatus
} from './client/enums'

const DEMO_PREFIX = 'Demo ·'

type TPrisma = PrismaClient

const startOfBusinessWeek = (date: Date) => startOfWeek(startOfDay(date), { weekStartsOn: 6 })

const weeklyWindowOn = (date: Date) => {
  const today = startOfDay(date)
  if (today.getDay() === 5) {
    const rangeStart = addDays(today, 1)
    return { rangeStart, rangeEnd: addDays(rangeStart, 5) }
  }
  const rangeStart = startOfBusinessWeek(today)
  return { rangeStart, rangeEnd: addDays(rangeStart, 5) }
}

const monthlyWindowOn = (date: Date) => {
  const rangeStart = startOfMonth(startOfDay(date))
  return { rangeStart, rangeEnd: startOfDay(endOfMonth(rangeStart)) }
}

const shiftWeekly = (window: { rangeStart: Date; rangeEnd: Date }, weeks: number) => ({
  rangeStart: addDays(window.rangeStart, weeks * 7),
  rangeEnd: addDays(window.rangeEnd, weeks * 7)
})

const nextWeekly = (window: { rangeStart: Date; rangeEnd: Date }) => shiftWeekly(window, 1)

const nextMonthly = (window: { rangeStart: Date; rangeEnd: Date }) => {
  const rangeStart = startOfMonth(addMonths(window.rangeStart, 1))
  return { rangeStart, rangeEnd: startOfDay(endOfMonth(rangeStart)) }
}

const createPrisma = () =>
  new PrismaClient({
    adapter: new PrismaMariaDb({
      host: process.env.NUXT_DATABASE_HOST,
      user: process.env.NUXT_DATABASE_USER,
      password: process.env.NUXT_DATABASE_PASSWORD,
      database: process.env.NUXT_DATABASE_NAME,
      port: Number(process.env.NUXT_DATABASE_PORT),
      allowPublicKeyRetrieval: true
    })
  })

const requireUsers = async (prisma: TPrisma, emails: string[]) => {
  const users = await prisma.user.findMany({
    where: { email: { in: emails }, deletedAt: null },
    select: { id: true, name: true, email: true }
  })
  const missing = emails.filter(email => !users.some(user => user.email === email))
  if (missing.length) {
    throw new Error(`Missing users for target seed: ${missing.join(', ')}`)
  }
  return Object.fromEntries(users.map(user => [user.email as string, user.id])) as Record<
    string,
    number
  >
}

const requireTeams = async (prisma: TPrisma, names: string[]) => {
  const teams = await prisma.team.findMany({
    where: { name: { in: names }, deletedAt: null },
    select: { id: true, name: true }
  })
  const missing = names.filter(name => !teams.some(team => team.name === name))
  if (missing.length) {
    throw new Error(`Missing teams for target seed: ${missing.join(', ')}`)
  }
  return Object.fromEntries(teams.map(team => [team.name, team.id])) as Record<string, number>
}

type TCycleSeed = {
  window: { rangeStart: Date; rangeEnd: Date }
  status: TargetStatus
  items: { name: string; done?: boolean }[]
  userIds: number[]
  teamIds?: number[]
  name?: string
  description?: string
  priority?: TaskPriority
}

const createSeries = async (
  prisma: TPrisma,
  input: {
    creatorId: number
    name: string
    description: string
    frequency: TargetFrequency
    priority: TaskPriority
    next: { rangeStart: Date; rangeEnd: Date }
    cycles: TCycleSeed[]
    endsAt?: Date | null
  }
) => {
  const template = await prisma.task.create({
    data: {
      name: input.name,
      description: input.description,
      kind: TaskKind.TARGET,
      status: TaskStatus.TODO,
      priority: input.priority,
      creatorId: input.creatorId,
      recurrence: {
        create: {
          frequency: input.frequency,
          rangeStart: input.next.rangeStart,
          rangeEnd: input.next.rangeEnd,
          nextRunAt: input.next.rangeStart,
          endsAt: input.endsAt ?? null
        }
      }
    }
  })

  for (const cycle of input.cycles) {
    await prisma.task.create({
      data: {
        name: cycle.name ?? input.name,
        description: cycle.description ?? input.description,
        kind: TaskKind.TARGET,
        status: TaskStatus.TODO,
        targetStatus: cycle.status,
        priority: cycle.priority ?? input.priority,
        startsAt: cycle.window.rangeStart,
        dueAt: cycle.window.rangeEnd,
        creatorId: input.creatorId,
        parentId: template.id,
        items: {
          create: cycle.items.map((item, sortOrder) => ({
            name: item.name,
            sortOrder,
            status: item.done ? TaskItemStatus.COMPLETED : TaskItemStatus.TODO,
            completedAt: item.done ? cycle.window.rangeEnd : null,
            completedById: item.done ? (cycle.userIds[0] ?? input.creatorId) : null
          }))
        },
        users: {
          create: cycle.userIds.map(userId => ({ userId }))
        },
        teams: {
          create: (cycle.teamIds || []).map(teamId => ({ teamId }))
        }
      }
    })
  }

  return template
}

export const seedTargets = async (prisma: TPrisma) => {
  const existing = await prisma.task.findMany({
    where: {
      kind: TaskKind.TARGET,
      name: { startsWith: DEMO_PREFIX }
    },
    select: { id: true, parentId: true }
  })
  const templateIds = [
    ...new Set(
      existing.map(row => row.parentId || row.id).filter((id): id is number => Number.isInteger(id))
    )
  ]
  if (templateIds.length) {
    await prisma.task.deleteMany({
      where: { id: { in: templateIds } }
    })
  }

  const users = await requireUsers(prisma, [
    'super@test.com',
    'john@example.com',
    'manager@test.com',
    'salesman@test.com',
    'admin@test.com',
    'fudewi@mailinator.com',
    'hicamywyr@mailinator.com',
    'kygunedic@mailinator.com'
  ])
  const teams = await requireTeams(prisma, ['Team A', 'Team B'])

  const superAdmin = users['super@test.com']
  const john = users['john@example.com']
  const manager = users['manager@test.com']
  const salesman = users['salesman@test.com']
  const admin = users['admin@test.com']
  const wesley = users['fudewi@mailinator.com']
  const leigh = users['hicamywyr@mailinator.com']
  const maggy = users['kygunedic@mailinator.com']

  const currentWeek = weeklyWindowOn(new Date())
  const weeks = [5, 4, 3, 2, 1, 0].map(offset => shiftWeekly(currentWeek, -offset))
  const currentMonth = monthlyWindowOn(new Date())
  const lastMonth = monthlyWindowOn(addMonths(new Date(), -1))
  const twoMonthsAgo = monthlyWindowOn(addMonths(new Date(), -2))

  const visitItems = (doneCount: number, extra?: { name: string; done?: boolean }[]) => {
    const base = [
      { name: 'Confirm 8 walk-ins', done: doneCount >= 1 },
      { name: 'Follow up 12 hot leads', done: doneCount >= 2 },
      { name: 'Submit weekly visit report', done: doneCount >= 3 }
    ]
    return extra ? [...base, ...extra] : base
  }

  await createSeries(prisma, {
    creatorId: superAdmin,
    name: `${DEMO_PREFIX}Weekly site visits`,
    description: 'Hit the weekly visit quota for the sales floor.',
    frequency: TargetFrequency.WEEKLY,
    priority: TaskPriority.HIGH,
    next: nextWeekly(currentWeek),
    cycles: [
      {
        window: weeks[0],
        status: TargetStatus.ACHIEVED,
        items: visitItems(3),
        userIds: [john, salesman]
      },
      {
        window: weeks[1],
        status: TargetStatus.MISSED,
        items: visitItems(1),
        userIds: [john]
      },
      {
        window: weeks[2],
        status: TargetStatus.SKIPPED,
        items: visitItems(0),
        userIds: [salesman],
        description: 'Eid week — cycle skipped.'
      },
      {
        window: weeks[3],
        status: TargetStatus.ACHIEVED,
        items: visitItems(3),
        userIds: [wesley, leigh]
      },
      {
        window: weeks[4],
        status: TargetStatus.MISSED,
        items: visitItems(2),
        userIds: [leigh, salesman]
      },
      {
        window: weeks[5],
        status: TargetStatus.RUNNING,
        name: `${DEMO_PREFIX}Weekly site visits`,
        description: 'Current cycle — book two extra visits this week.',
        items: visitItems(1, [{ name: 'Book 2 additional site visits', done: false }]),
        userIds: [wesley, leigh, salesman],
        teamIds: [teams['Team A']]
      }
    ]
  })

  await createSeries(prisma, {
    creatorId: superAdmin,
    name: `${DEMO_PREFIX}Monthly bookings`,
    description: 'Close booked units for the calendar month.',
    frequency: TargetFrequency.MONTHLY,
    priority: TaskPriority.URGENT,
    next: nextMonthly(currentMonth),
    cycles: [
      {
        window: twoMonthsAgo,
        status: TargetStatus.ACHIEVED,
        items: [
          { name: 'Lock 4 bookings', done: true },
          { name: 'Collect 4 token payments', done: true }
        ],
        userIds: [manager, maggy],
        teamIds: [teams['Team A']]
      },
      {
        window: lastMonth,
        status: TargetStatus.MISSED,
        items: [
          { name: 'Lock 4 bookings', done: true },
          { name: 'Collect 4 token payments', done: false }
        ],
        userIds: [manager, maggy],
        teamIds: [teams['Team A']]
      },
      {
        window: currentMonth,
        status: TargetStatus.RUNNING,
        items: [
          { name: 'Lock 5 bookings', done: false },
          { name: 'Collect 5 token payments', done: false },
          { name: 'Update CRM booking board daily', done: true }
        ],
        userIds: [manager, maggy, admin],
        teamIds: [teams['Team A']]
      }
    ]
  })

  const customEnd = startOfDay(new Date())
  const customCurrentStart = addDays(customEnd, -4)
  const customPrev = {
    rangeStart: addDays(customCurrentStart, -10),
    rangeEnd: addDays(customCurrentStart, -1)
  }
  const customOlder = {
    rangeStart: addDays(customPrev.rangeStart, -10),
    rangeEnd: addDays(customPrev.rangeStart, -1)
  }
  const customCurrent = { rangeStart: customCurrentStart, rangeEnd: customEnd }
  const customNext = {
    rangeStart: addDays(customEnd, 1),
    rangeEnd: addDays(customEnd, 10)
  }

  await createSeries(prisma, {
    creatorId: superAdmin,
    name: `${DEMO_PREFIX}10-day pipeline push`,
    description: 'Custom 10-day sprint to clear the pipeline.',
    frequency: TargetFrequency.CUSTOM,
    priority: TaskPriority.MEDIUM,
    next: customNext,
    cycles: [
      {
        window: customOlder,
        status: TargetStatus.ACHIEVED,
        items: [
          { name: 'Call every stalled lead', done: true },
          { name: 'Send 20 proposals', done: true }
        ],
        userIds: [john, wesley],
        teamIds: [teams['Team B']]
      },
      {
        window: customPrev,
        status: TargetStatus.MISSED,
        items: [
          { name: 'Call every stalled lead', done: true },
          { name: 'Send 20 proposals', done: false }
        ],
        userIds: [john],
        teamIds: [teams['Team B']]
      },
      {
        window: customCurrent,
        status: TargetStatus.RUNNING,
        items: [
          { name: 'Call every stalled lead', done: false },
          { name: 'Send 20 proposals', done: false },
          { name: 'Schedule 6 revisits', done: true }
        ],
        userIds: [john, wesley, salesman],
        teamIds: [teams['Team B']]
      }
    ]
  })

  await createSeries(prisma, {
    creatorId: superAdmin,
    name: `${DEMO_PREFIX}Paused collections`,
    description: 'Paused this cycle while finance reviews overdue tokens.',
    frequency: TargetFrequency.WEEKLY,
    priority: TaskPriority.MEDIUM,
    next: nextWeekly(currentWeek),
    cycles: [
      {
        window: weeks[4],
        status: TargetStatus.ACHIEVED,
        items: [
          { name: 'Collect 6 overdue tokens', done: true },
          { name: 'Escalate 2 cases to finance', done: true }
        ],
        userIds: [admin, maggy]
      },
      {
        window: weeks[5],
        status: TargetStatus.PAUSED,
        items: [
          { name: 'Collect 6 overdue tokens', done: false },
          { name: 'Escalate 2 cases to finance', done: true }
        ],
        userIds: [admin, maggy]
      }
    ]
  })

  await createSeries(prisma, {
    creatorId: superAdmin,
    name: `${DEMO_PREFIX}Stopped referral drive`,
    description: 'Series ended after two completed cycles.',
    frequency: TargetFrequency.WEEKLY,
    priority: TaskPriority.LOW,
    next: nextWeekly(weeks[4]),
    endsAt: weeks[4].rangeEnd,
    cycles: [
      {
        window: weeks[3],
        status: TargetStatus.ACHIEVED,
        items: [
          { name: 'Ask 10 customers for referrals', done: true },
          { name: 'Log 5 referral leads', done: true }
        ],
        userIds: [leigh]
      },
      {
        window: weeks[4],
        status: TargetStatus.STOPPED,
        items: [
          { name: 'Ask 10 customers for referrals', done: true },
          { name: 'Log 5 referral leads', done: false }
        ],
        userIds: [leigh, john]
      }
    ]
  })

  console.log('Seeded demo target series with past and current cycles.')
}

const isDirectRun = process.argv[1]?.includes('seed-targets')

if (isDirectRun) {
  const prisma = createPrisma()
  seedTargets(prisma)
    .then(async () => {
      await prisma.$disconnect()
    })
    .catch(async error => {
      console.error(error)
      await prisma.$disconnect()
      process.exit(1)
    })
}
