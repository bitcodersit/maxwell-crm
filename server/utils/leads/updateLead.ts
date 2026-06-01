import { z } from 'zod'
import { getLeadScopedWhere } from './getLeadScopedWhere'
import { selectLeadForDisplay, selectLeadForUpdate } from './select'

export type TZUpdateLead = z.infer<typeof zUpdateLead>
export const zUpdateLead = z.object({
  status: z.enum(LeadStatus).nullish(),

  // Budget
  budgetMin: z.number().positive().nullish(),
  budgetMax: z.number().positive().nullish(),

  // Assignable Ids
  userIds: z.array(zId()).nullish(),
  teamIds: z.array(zId()).nullish(),

  // Option Ids
  sourceId: zId().nullish(),
  propertyTypeMainId: zId().nullish(),
  propertyTypeSubId: zId().nullish(),

  addressId: zId().nullish(),
  customerId: zId().nullish()
})

export const updateLead = async (id: number, input: TZUpdateLead, user: TUser) => {
  const data: Prisma.XOR<Prisma.LeadUpdateInput, Prisma.LeadUncheckedUpdateInput> = {}

  const where = getLeadScopedWhere(user, {
    id
  })

  const existing = await prisma.lead.findFirst({
    where,
    select: selectLeadForUpdate
  })

  if (!existing) {
    throw err.notFound()
  }

  if (input.status) data.status = input.status
  if (input.sourceId !== undefined) data.sourceId = input.sourceId
  if (input.budgetMin !== undefined) data.budgetMin = input.budgetMin
  if (input.budgetMax !== undefined) data.budgetMax = input.budgetMax
  if (input.addressId !== undefined) data.addressId = input.addressId
  if (input.customerId !== undefined) data.customerId = input.customerId
  if (input.propertyTypeSubId !== undefined) data.propertyTypeSubId = input.propertyTypeSubId
  if (input.propertyTypeMainId !== undefined) data.propertyTypeMainId = input.propertyTypeMainId

  if (user.updateAnyLeads) {
    if (input.userIds) {
      data.assignable = {
        update: {
          users: {
            deleteMany: {
              userId: {
                notIn: input.userIds
              }
            },
            createMany: {
              skipDuplicates: true,
              data: input.userIds.map(userId => ({
                userId,
                assignerId: user.id
              }))
            }
          }
        }
      }
    } else if (input.userIds === null) {
      data.assignable = {
        update: {
          users: {
            deleteMany: {}
          }
        }
      }
    }

    if (input.teamIds) {
      data.assignable = {
        update: {
          teams: {
            deleteMany: {
              teamId: {
                notIn: input.teamIds
              }
            },
            createMany: {
              skipDuplicates: true,
              data: input.teamIds.map(teamId => ({
                teamId,
                assignerId: user.id
              }))
            }
          }
        }
      }
    } else if (input.teamIds === null) {
      data.assignable = {
        update: {
          teams: {
            deleteMany: {}
          }
        }
      }
    }
  }

  const lead = await prisma.lead.update({
    where: { id },
    data,
    include: selectLeadForDisplay
  })

  /**
   * @TODO: Notify new assignees
   */

  return lead
}
