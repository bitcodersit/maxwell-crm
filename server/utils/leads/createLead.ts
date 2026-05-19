import { z } from 'zod'
import { createAddress, zAddress } from '../address'
import { createCustomer, zCreateCustomer } from '../customer'
import { generateLeadSid } from './generateLeadSid'
import { selectLeadForDisplay } from './select'

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
  address: zAddress.nullish(),

  // Customer or customer id
  customerId: zId().nullish(),
  customer: zCreateCustomer.nullish()
})

export const createLead = async (input: TZCreateLead, user: Pick<TUser, 'id'>) => {
  const assignable = await prisma.assignable.create({
    data: {
      assignedUsers: {
        create: input.userIds.map(userId => ({
          userId,
          assignerId: user.id
        }))
      },
      assignedTeams: {
        create: input.teamIds.map(teamId => ({
          teamId,
          assignerId: user.id
        }))
      }
    }
  })

  let addressId: number | undefined
  if (!input.addressId && input.address?.addressLine1) {
    addressId = (await createAddress(input.address)).id
  }

  let customerId: number | undefined
  if (!input.customerId && input.customer?.phone) {
    customerId = (await createCustomer(input.customer)).id
  }

  const lead = await prisma.lead.create({
    include: selectLeadForDisplay,
    data: {
      addressId,
      customerId,
      sid: await generateLeadSid(),
      status: input.status,
      creatorId: user.id,
      assignableId: assignable.id,
      budgetMin: input.budgetMin,
      budgetMax: input.budgetMax,
      sourceId: input.sourceId,
      propertyTypeMainId: input.propertyTypeMainId,
      propertyTypeSubId: input.propertyTypeSubId
    }
  })

  /**
   * @TODO: Notify new assignees
   */

  return lead
}
