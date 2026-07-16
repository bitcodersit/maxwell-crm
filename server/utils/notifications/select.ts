import type { Prisma } from '~~/prisma/client/client'
import { selectUserForDisplay } from '../users/select'

export const selectNotificationRecipientInbox = {
  id: true,
  readAt: true,
  createdAt: true,
  notification: {
    select: {
      id: true,
      type: true,
      title: true,
      body: true,
      subjectType: true,
      subjectId: true,
      data: true,
      createdAt: true,
      actor: selectUserForDisplay
    }
  }
} satisfies Prisma.NotificationRecipientSelect

export type TNotificationInboxRow = Prisma.NotificationRecipientGetPayload<{
  select: typeof selectNotificationRecipientInbox
}>

export const mapNotificationInboxItem = (row: TNotificationInboxRow) => {
  const { notification } = row
  const data =
    notification.data && typeof notification.data === 'object' && !Array.isArray(notification.data)
      ? (notification.data as Record<string, unknown>)
      : null

  const sid = typeof data?.sid === 'string' ? data.sid : null
  const hrefFromData = typeof data?.href === 'string' ? data.href : null

  let href = hrefFromData
  if (!href && notification.subjectType === 'LEAD') {
    href = sid ? `/leads/${sid}` : notification.subjectId ? `/leads/${notification.subjectId}` : null
  }
  if (!href && notification.subjectType === 'PROPERTY' && notification.subjectId) {
    href = `/properties/${notification.subjectId}`
  }

  return {
    id: row.id,
    notificationId: notification.id,
    unread: !row.readAt,
    type: notification.type,
    title: notification.title,
    body: notification.body,
    subjectType: notification.subjectType,
    subjectId: notification.subjectId,
    data,
    href,
    sender: notification.actor,
    date: notification.createdAt.toISOString(),
    readAt: row.readAt?.toISOString() ?? null,
    createdAt: row.createdAt.toISOString()
  }
}

export type TNotificationInboxItem = ReturnType<typeof mapNotificationInboxItem>
