import type { H3Event } from 'h3'
import {
  mapNotificationInboxItem,
  selectNotificationRecipientInbox
} from './select'

export const markNotificationRead = async (event: H3Event, id: number) => {
  const user = await getCurrentUser(event)

  const existing = await prisma.notificationRecipient.findFirst({
    where: {
      id,
      userId: user.id,
      deletedAt: null
    },
    select: {
      id: true,
      readAt: true
    }
  })

  if (!existing) throw err.notFound()

  const row = existing.readAt
    ? await prisma.notificationRecipient.findFirstOrThrow({
        where: {
          id: existing.id
        },
        select: selectNotificationRecipientInbox
      })
    : await prisma.notificationRecipient.update({
        where: {
          id: existing.id
        },
        data: {
          readAt: new Date(),
          seenAt: new Date()
        },
        select: selectNotificationRecipientInbox
      })

  return mapNotificationInboxItem(row)
}

export const markAllNotificationsRead = async (event: H3Event) => {
  const user = await getCurrentUser(event)
  const readAt = new Date()

  const result = await prisma.notificationRecipient.updateMany({
    where: {
      userId: user.id,
      deletedAt: null,
      readAt: null
    },
    data: {
      readAt,
      seenAt: readAt
    }
  })

  return {
    count: result.count
  }
}
