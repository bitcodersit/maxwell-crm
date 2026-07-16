import { z } from 'zod'
import { upsertAddress, zUpsertAddress } from '../address'
import { upsertCustomer, zUpsertCustomer } from '../customer'
import { getConnect } from '../getConnect'
import { notifyLeadCreated } from './notifyLeadAssignees'

export type TZCreateLead = z.infer<typeof zCreateLead>
export const zCreateLead = z.object({
  status: z.enum(LeadStatus).default('New'),

  // Budget
  budgetMin: z.number().positive().nullish(),
  budgetMax: z.number().positive().nullish(),

  // Assignable Ids
  userIds: z.array(zId()).default([]),
  teamIds: z.array(zId()).default([]),

  // Option Ids
  sourceId: zId().nullish(),
  propertyTypeMainId: zId().nullish(),
  propertyTypeSubId: zId().nullish(),

  // Address or address id
  addressId: zId().nullish(),
  address: zUpsertAddress.nullish(),

  // Customer or customer id
  customerId: zId().nullish(),
  customer: zUpsertCustomer.nullish()
})

export const createLead = async (input: TZCreateLead, user: TUser) => {
  if (!input.addressId && input.address) {
    input.addressId = (await upsertAddress(input.address)).id
  }

  if (!input.customerId && input.customer) {
    input.customerId = (await upsertCustomer(input.customer)).id
  }

  const lead = await prisma.lead.create({
    include: selectLeadForDisplay,
    data: {
      sid: await generateLeadSid(),
      status: input.status,
      budgetMin: input.budgetMin,
      budgetMax: input.budgetMax,
      source: getConnect(input.sourceId),
      creator: getConnect(user.id),
      address: getConnect(input.addressId),
      customer: getConnect(input.customerId),
      propertyTypeSub: getConnect(input.propertyTypeSubId),
      propertyTypeMain: getConnect(input.propertyTypeMainId),
      assignable: {
        create: {
          users:
            input.userIds.length > 0
              ? {
                  create: input.userIds.map(userId => ({
                    userId,
                    assignerId: user.id
                  }))
                }
              : undefined,
          teams:
            input.teamIds.length > 0
              ? {
                  create: input.teamIds.map(teamId => ({
                    teamId,
                    assignerId: user.id
                  }))
                }
              : undefined
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

  // Assign lead to the default board
  const boardItem = await assignLeadToTheBoard(lead.id)
  if (boardItem) lead.boardItems = [boardItem]

  try {
    await notifyLeadCreated(lead, user)
  } catch (error) {
    console.error('Failed to notify lead created', error)
  }

  return lead
}
