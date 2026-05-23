import type { H3Event } from 'h3'
import { z } from 'zod'

export type TZCreateVisit = z.infer<typeof zCreateVisit>
export const zCreateVisit = z
  .object({
    date: zDate().nullish(),
    status: z.enum(VisitStatus).default('PENDING'),
    checkIn: z.record(z.string(), z.any()).nullish(),
    nextAction: zString().nullish(),
    customerPresence: zString().nullish(),
    userIds: z.array(zId()).default([]),
    teamIds: z.array(zId()).default([])
  })
  .and(zVisitLeadOrProperty)
  .and(zCreateAttachmentsBase.partial())

export type TZUpdateVisit = z.infer<typeof zUpdateVisit>
export const zUpdateVisit = z
  .object({
    id: zId(),
    date: zDate().nullish(),
    status: z.enum(VisitStatus).nullish(),
    checkIn: z.record(z.string(), z.any()).nullish(),
    nextAction: zString().nullish(),
    customerPresence: zString().nullish(),
    userIds: z.array(zId()).nullish(),
    teamIds: z.array(zId()).nullish()
  })
  .and(zCreateAttachmentsBase.partial())

export type TZUpsertVisit = z.infer<typeof zUpsertVisit>
export const zUpsertVisit = z.union([zUpdateVisit, zCreateVisit])

export const upsertVisit = async (event: H3Event, options?: { input?: TZUpsertVisit }) => {
  const user = await getCurrentUser(event)
  const input = await getInput(event, zUpsertVisit, options)

  if ('id' in input) {
    const visit = await prisma.visit.findUnique({
      where: { id: input.id },
      select: {
        id: true,
        date: true,
        status: true,
        checkIn: true,
        nextAction: true,
        customerPresence: true,
        attachableId: true
      }
    })
    if (!visit) throw err.notFound()

    const data: Prisma.VisitUpdateInput = {}

    if (input.date && input.date.getTime() !== visit.date.getTime()) {
      data.date = input.date
    }
    if (input.status && input.status !== visit.status) {
      data.status = input.status
    }
    if (input.checkIn !== undefined) {
      data.checkIn = input.checkIn as Prisma.InputJsonValue
    }
    if (input.nextAction !== undefined && input.nextAction !== visit.nextAction) {
      data.nextAction = input.nextAction
    }
    if (input.customerPresence !== undefined && input.customerPresence !== visit.customerPresence) {
      data.customerPresence = input.customerPresence
    }

    if (input.userIds?.length || input.teamIds?.length) {
      data.assignable = getAssignableUpdate(input, user)
    }

    if (Object.keys(data).length) {
      await prisma.visit.update({
        where: { id: input.id },
        data
      })
    }

    if (input.files?.length) {
      await createAttachments(event, {
        input: {
          attachableId: visit.attachableId!,
          attachableModelId: visit.id,
          attachableModelType: 'visit',
          files: input.files,
          folder: 'visits'
        }
      })
    }

    return {
      message: 'Visit updated successfully'
    }
  }

  const visit = await prisma.visit.create({
    data: {
      date: input.date ?? new Date(),
      status: input.status,
      checkIn: input.checkIn as Prisma.InputJsonValue | undefined,
      nextAction: input.nextAction,
      customerPresence: input.customerPresence,
      lead: getConnect(input.leadId),
      author: getConnect(user.id),
      property: getConnect(input.propertyId),
      assignable: getAssignableCreate(input, user),
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
        attachableId: visit.attachableId!,
        attachableModelId: visit.id,
        attachableModelType: 'visit',
        files: input.files,
        folder: 'visits'
      }
    })
  }

  return {
    message: 'Visit created successfully'
  }
}
