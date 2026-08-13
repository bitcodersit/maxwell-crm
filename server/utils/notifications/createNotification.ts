import type { Prisma } from '~~/prisma/client/client'
import type {
  NotificationSubjectType,
  NotificationType
} from '~~/prisma/client/enums'
import {
  resolveRecipientIds,
  type TResolveRecipientIdsInput
} from './resolveRecipientIds'

export type TCreateNotificationInput = {
  type: NotificationType
  title: string
  body: string
  actorId?: number | null
  subjectType?: NotificationSubjectType | null
  subjectId?: number | null
  data?: Prisma.InputJsonValue | null
} & Pick<
  TResolveRecipientIdsInput,
  'recipientIds' | 'assignableId' | 'includeAdmins' | 'excludeUserIds' | 'skipActor'
>

export const createNotification = async (input: TCreateNotificationInput) => {
  const recipientIds = await resolveRecipientIds({
    recipientIds: input.recipientIds,
    assignableId: input.assignableId,
    includeAdmins: input.includeAdmins,
    excludeUserIds: input.excludeUserIds,
    skipActor: input.skipActor,
    actorId: input.actorId
  })

  if (!recipientIds.length) return null

  return prisma.$transaction(async tx => {
    const notification = await tx.notification.create({
      data: {
        type: input.type,
        title: input.title,
        body: input.body,
        actorId: input.actorId ?? null,
        subjectType: input.subjectType ?? null,
        subjectId: input.subjectId ?? null,
        data: input.data ?? undefined
      }
    })

    await tx.notificationRecipient.createMany({
      data: recipientIds.map(userId => ({
        notificationId: notification.id,
        userId
      }))
    })

    return notification
  })
}
