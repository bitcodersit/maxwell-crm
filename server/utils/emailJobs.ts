import { sendMail } from './sendMail'

type TEmailJobFrequency = 'ONCE' | 'DAILY' | 'WEEKLY' | 'MONTHLY'
type TEmailJobAction = {
  type?: string
  done?: boolean
  [key: string]: any
}

type TQueueEmailInput = {
  to: string | string[]
  cc?: string | string[]
  bcc?: string | string[]
  subject: string
  html: string
  priority?: 'NORMAL' | 'URGENT'
  maxAttempts?: number
  scheduledAt?: Date
  sendNow?: boolean
  frequency?: TEmailJobFrequency
  action?: TEmailJobAction
}

const toRecipientList = (to: string | string[]) => {
  return Array.isArray(to) ? to : [to]
}

const fromRecipientList = (raw: any): string[] => {
  if (Array.isArray(raw)) return raw.map((v) => String(v)).filter(Boolean)
  if (typeof raw === 'string') return [raw]
  return []
}

const getNextScheduledAt = (frequency: TEmailJobFrequency) => {
  const now = Date.now()
  if (frequency === 'DAILY') return new Date(now + 24 * 60 * 60 * 1000)
  if (frequency === 'WEEKLY') return new Date(now + 7 * 24 * 60 * 60 * 1000)
  if (frequency === 'MONTHLY') return new Date(now + 30 * 24 * 60 * 60 * 1000)
  return new Date(now)
}

const shouldSendByAction = async (job: {
  action: any
}) => {
  const action = (job.action || {}) as TEmailJobAction
  if (!action.type || action.done) return true

  if (action.type === 'user-still-unverified') {
    const userId = Number(action?.userId ?? action?.payload?.userId)
    if (!userId) return false
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        emailVerifiedAt: true,
        deletedAt: true,
      },
    })
    return !!user && !user.deletedAt && !user.emailVerifiedAt
  }

  return true
}

const lockJobForProcessing = async (id: number) => {
  return prisma.emailJob.updateMany({
    where: {
      id,
      status: {
        in: ['PENDING', 'FAILED'],
      },
      attempts: {
        lt: prisma.emailJob.fields.maxAttempts,
      },
    },
    data: {
      status: 'PROCESSING',
      attempts: {
        increment: 1,
      },
      message: null,
    },
  })
}

export const dispatchEmailJob = async (id: number) => {
  const locked = await lockJobForProcessing(id)
  if (!locked.count) return { ok: false as const, reason: 'not-available' as const }

  const job = await prisma.emailJob.findUnique({
    where: { id },
    select: {
      id: true,
      to: true,
      cc: true,
      bcc: true,
      subject: true,
      html: true,
      frequency: true,
      action: true,
    },
  })
  if (!job) return { ok: false as const, reason: 'not-found' as const }

  try {
    const canSend = await shouldSendByAction(job)
    if (!canSend) {
      await prisma.emailJob.update({
        where: { id: job.id },
        data:
          job.frequency !== 'ONCE'
            ? {
                status: 'PENDING',
                attempts: 0,
                scheduledAt: getNextScheduledAt(job.frequency),
              }
            : {
                status: 'SKIPPED',
                message: 'Skipped by action checker',
              },
      })
      return { ok: false as const, reason: 'skipped' as const }
    }

    const to = fromRecipientList(job.to)
    const cc = fromRecipientList(job.cc)
    const bcc = fromRecipientList(job.bcc)
    if (!to.length) {
      await prisma.emailJob.update({
        where: { id: job.id },
        data: {
          status: 'FAILED',
          message: 'Email has no recipients',
          failedAt: new Date(),
        },
      })
      return { ok: false as const, reason: 'send-failed' as const }
    }

    await sendMail({
      to,
      cc: cc.length ? cc : undefined,
      bcc: bcc.length ? bcc : undefined,
      subject: job.subject,
      html: job.html,
    })
    await prisma.emailJob.update({
      where: { id: job.id },
      data: {
        status: job.frequency === 'ONCE' ? 'SENT' : 'PENDING',
        sentAt: new Date(),
        attempts: 0,
        scheduledAt: job.frequency !== 'ONCE' ? getNextScheduledAt(job.frequency) : undefined,
      },
    })
    return { ok: true as const }
  } catch (error: any) {
    await prisma.emailJob.update({
      where: { id: job.id },
      data: {
        status: 'FAILED',
        message: error?.message || String(error),
        failedAt: new Date(),
        scheduledAt: new Date(Date.now() + 60 * 1000),
      },
    })
    return { ok: false as const, reason: 'send-failed' as const }
  }
}

export const queueEmail = async (input: TQueueEmailInput) => {
  const job = await prisma.emailJob.create({
    data: {
      to: toRecipientList(input.to),
      cc: input.cc ? toRecipientList(input.cc) : undefined,
      bcc: input.bcc ? toRecipientList(input.bcc) : undefined,
      subject: input.subject,
      html: input.html,
      priority: input.priority || 'NORMAL',
      maxAttempts: input.maxAttempts || 3,
      scheduledAt: input.scheduledAt || new Date(),
      status: 'PENDING',
      frequency: input.frequency || 'ONCE',
      action: input.action,
    },
    select: {
      id: true,
    },
  })

  if (input.sendNow) {
    await dispatchEmailJob(job.id)
  }

  return job
}

export const dispatchPendingEmails = async (limit = 20) => {
  const now = new Date()
  const jobs = await prisma.emailJob.findMany({
    where: {
      status: {
        in: ['PENDING', 'FAILED'],
      },
      scheduledAt: {
        lte: now,
      },
      attempts: {
        lt: prisma.emailJob.fields.maxAttempts,
      },
    },
    orderBy: [{ priority: 'desc' }, { createdAt: 'asc' }],
    take: limit,
    select: {
      id: true,
    },
  })

  let sent = 0
  let failed = 0
  let skipped = 0
  for (const job of jobs) {
    const result = await dispatchEmailJob(job.id)
    if (result.ok) sent++
    else if (result.reason === 'send-failed') failed++
    else if (result.reason === 'skipped') skipped++
  }

  return {
    checked: jobs.length,
    sent,
    failed,
    skipped,
  }
}
