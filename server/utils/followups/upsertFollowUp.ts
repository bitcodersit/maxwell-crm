import type { H3Event } from 'h3'
import { z } from 'zod'

export type TZCreateFollowUp = z.infer<typeof zCreateFollowUp>
export const zCreateFollowUp = z
  .object({
    leadId: zId(),
    date: zDate().nullish(),
    type: z.enum(FollowUpType),
    status: z.enum(FollowUpStatus).default('Pending' as any),
    outcome: zString().nullish(),
    nextDate: zDate().nullish()
  })
  .and(zCreateAttachmentsBase.partial())

export type TZUpdateFollowUp = z.infer<typeof zUpdateFollowUp>
export const zUpdateFollowUp = z
  .object({
    id: zId(),
    date: zDate().nullish(),
    type: z.enum(FollowUpType).nullish(),
    status: z.enum(FollowUpStatus).nullish(),
    outcome: zString().nullish(),
    nextDate: zDate().nullish()
  })
  .and(zCreateAttachmentsBase.partial())

export type TZUpsertFollowUp = z.infer<typeof zUpsertFollowUp>
export const zUpsertFollowUp = z.union([zUpdateFollowUp, zCreateFollowUp])

export const upsertFollowUp = async (event: H3Event, options?: { input?: TZUpsertFollowUp }) => {
  const user = await getCurrentUser(event)
  const input = await getInput(event, zUpsertFollowUp, options)

  if ('id' in input) {
    const followUp = await prisma.followUp.findUnique({
      where: { id: input.id },
      select: {
        id: true,
        date: true,
        type: true,
        status: true,
        outcome: true,
        nextDate: true,
        attachableId: true
      }
    })
    if (!followUp) throw err.notFound()

    const data: Prisma.FollowUpUpdateInput = {}

    if (input.date && input.date.getTime() !== followUp.date.getTime()) {
      data.date = input.date
    }
    if (input.type && input.type !== followUp.type) {
      data.type = input.type
    }
    if (input.status && input.status !== followUp.status) {
      data.status = input.status
    }
    if (input.outcome !== undefined && input.outcome !== followUp.outcome) {
      data.outcome = input.outcome
    }

    const nextDateChanged =
      input.nextDate !== undefined && input.nextDate?.getTime() !== followUp.nextDate?.getTime()
    if (nextDateChanged) {
      data.nextDate = input.nextDate
    }

    if (Object.keys(data).length) {
      await prisma.followUp.update({
        where: { id: input.id },
        data
      })
    }

    if (input.files?.length) {
      await createAttachments(event, {
        input: {
          attachableId: followUp.attachableId!,
          attachableModelId: followUp.id,
          attachableModelType: 'followUp',
          files: input.files,
          folder: 'follow-ups'
        }
      })
    }

    return {
      message: 'Follow-up updated successfully'
    }
  }

  const followUp = await prisma.followUp.create({
    data: {
      date: input.date ?? new Date(),
      type: input.type,
      status: input.status,
      outcome: input.outcome,
      nextDate: input.nextDate,
      author: getConnect(user.id),
      lead: {
        connect: {
          id: input.leadId
        }
      },
      attachable: {
        create: {}
      },
      commentable: {
        create: {}
      }
    }
  })

  if (input.files?.length) {
    await createAttachments(event, {
      input: {
        attachableId: followUp.attachableId!,
        attachableModelId: followUp.id,
        attachableModelType: 'followUp',
        files: input.files,
        folder: 'follow-ups'
      }
    })
  }

  return {
    message: 'Follow-up created successfully'
  }
}
