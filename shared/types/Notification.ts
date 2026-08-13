import type { TMaybe, TPrettify } from '.'
import type { TUser } from './User'
import type { NotificationType, NotificationSubjectType } from '~~/prisma/client/enums'

export type TNotificationInboxItem = {
  id: number
  notificationId: number
  unread: boolean
  type: NotificationType
  title: string
  body: string
  subjectType: TMaybe<NotificationSubjectType>
  subjectId: TMaybe<number>
  data: TMaybe<Record<string, unknown>>
  href: TMaybe<string>
  sender: TMaybe<Pick<TUser, 'id' | 'name' | 'email' | 'avatar'>>
  date: string
  readAt: TMaybe<string>
  createdAt: string
}

export type TNotificationsResponse = TPrettify<
  {
    data: TNotificationInboxItem[]
    unreadCount: number
  } & Partial<{
    page: number
    total: number
    perPage: number
    totalPages: number
  }>
>
