import type { H3Event } from 'h3'
import { z } from 'zod'
import type { Prisma } from '~~/prisma/client/client'
import {
  mapNotificationInboxItem,
  selectNotificationRecipientInbox
} from './select'

export type TZGetNotifications = z.infer<typeof zGetNotifications>
export const zGetNotifications = z
  .object({
    unread: zBoolean().nullish(),
    orderBy: zOrderByRecord(['createdAt']).default([
      {
        createdAt: 'desc'
      }
    ])
  })
  .and(zPagination({ perPage: 20 }))

export const getMyNotifications = async (
  event: H3Event,
  options?: { input?: TZGetNotifications }
) => {
  const user = await getCurrentUser(event)
  const input = await getInput(event, zGetNotifications, options)

  const where: Prisma.NotificationRecipientWhereInput = {
    userId: user.id,
    deletedAt: null,
    ...(input.unread === true
      ? {
          readAt: null
        }
      : input.unread === false
        ? {
            readAt: {
              not: null
            }
          }
        : {})
  }

  const { take, skip, paginate } = getPagination(input)

  const [total, rows, unreadCount] = await prisma.$transaction([
    prisma.notificationRecipient.count({ where }),
    prisma.notificationRecipient.findMany({
      where,
      take,
      skip,
      orderBy: input.orderBy,
      select: selectNotificationRecipientInbox
    }),
    prisma.notificationRecipient.count({
      where: {
        userId: user.id,
        deletedAt: null,
        readAt: null
      }
    })
  ])

  const data = rows.map(mapNotificationInboxItem)
  const page = paginate(data, total)

  if (Array.isArray(page)) {
    return {
      data: page,
      unreadCount
    }
  }

  return {
    ...page,
    unreadCount
  }
}
