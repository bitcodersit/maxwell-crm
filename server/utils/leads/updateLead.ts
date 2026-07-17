import { z } from 'zod'
import { upsertAddress, zUpsertAddress } from '../address'
import { getAssignableCreate } from '../assignable'
import { upsertCustomer, zUpsertCustomer } from '../customer'
import { getAssignableUserIds } from '../notifications'
import { getLeadScopedWhere } from './getLeadScopedWhere'
import { notifyLeadAssigned } from './notifyLeadAssignees'
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

  // Linked properties (LeadProperty join)
  propertyIds: z.array(zId()).nullish(),

  addressId: zId().nullish(),
  address: zUpsertAddress.nullish(),

  // null clears the linked customer (z.coerce.number would turn null into 0)
  customerId: z.union([zId(), z.null()]).optional(),
  customer: zUpsertCustomer.nullish()
})

const buildAssignableUsersUpdate = (userIds: number[], user: TUser) => ({
  deleteMany: userIds.length
    ? {
        userId: {
          notIn: userIds
        }
      }
    : {},
  ...(userIds.length
    ? {
        createMany: {
          skipDuplicates: true,
          data: userIds.map(userId => ({
            userId,
            assignerId: user.id
          }))
        }
      }
    : {})
})

const buildAssignableTeamsUpdate = (teamIds: number[], user: TUser) => ({
  deleteMany: teamIds.length
    ? {
        teamId: {
          notIn: teamIds
        }
      }
    : {},
  ...(teamIds.length
    ? {
        createMany: {
          skipDuplicates: true,
          data: teamIds.map(teamId => ({
            teamId,
            assignerId: user.id
          }))
        }
      }
    : {})
})

export const updateLead = async (id: number, input: TZUpdateLead, user: TUser) => {
  const data: Prisma.XOR<Prisma.LeadUpdateInput, Prisma.LeadUncheckedUpdateInput> = {}

  const where = getLeadScopedWhere(user, {
    id
  })

  const existing = await prisma.lead.findFirst({
    where,
    select: {
      assignableId: true,
      addressId: true,
      customerId: true,
      ...selectLeadForUpdate
    }
  })

  if (!existing) {
    throw err.notFound()
  }

  if (input.address) {
    const address = await upsertAddress({
      ...input.address,
      id: input.address.id ?? existing.addressId
    })
    data.addressId = address.id
  } else if (input.addressId !== undefined) {
    data.addressId = input.addressId
  }

  if (input.customer) {
    const customer = await upsertCustomer({
      ...input.customer,
      id: input.customer.id ?? existing.customerId
    })
    data.customer = { connect: { id: customer.id } }
  } else if (input.customerId !== undefined) {
    data.customer =
      input.customerId === null
        ? { disconnect: true }
        : { connect: { id: input.customerId } }
  }

  if (input.status) data.status = input.status
  if (input.sourceId !== undefined) data.sourceId = input.sourceId
  if (input.budgetMin !== undefined) data.budgetMin = input.budgetMin
  if (input.budgetMax !== undefined) data.budgetMax = input.budgetMax
  if (input.propertyTypeSubId !== undefined) data.propertyTypeSubId = input.propertyTypeSubId
  if (input.propertyTypeMainId !== undefined) data.propertyTypeMainId = input.propertyTypeMainId

  if (input.propertyIds !== undefined && input.propertyIds !== null) {
    const propertyIds = input.propertyIds
    data.properties = {
      deleteMany: propertyIds.length
        ? {
            propertyId: {
              notIn: propertyIds
            }
          }
        : {},
      ...(propertyIds.length
        ? {
            createMany: {
              skipDuplicates: true,
              data: propertyIds.map(propertyId => ({
                propertyId
              }))
            }
          }
        : {})
    }
  }

  let shouldNotifyAssignment = false

  if (user.updateAnyLeads) {
    const hasUserAssignment = input.userIds !== undefined && input.userIds !== null
    const hasTeamAssignment = input.teamIds !== undefined && input.teamIds !== null

    if (hasUserAssignment || hasTeamAssignment) {
      shouldNotifyAssignment = true
      const assignableUpdate: Prisma.AssignableUpdateWithoutLeadsInput = {}

      if (hasUserAssignment) {
        assignableUpdate.users = buildAssignableUsersUpdate(input.userIds ?? [], user)
      }
      if (hasTeamAssignment) {
        assignableUpdate.teams = buildAssignableTeamsUpdate(input.teamIds ?? [], user)
      }

      if (existing.assignableId) {
        data.assignable = {
          update: assignableUpdate
        }
      } else {
        data.assignable = getAssignableCreate(
          {
            userIds: input.userIds ?? [],
            teamIds: input.teamIds ?? []
          },
          user
        )
      }
    } else if (input.userIds === null) {
      data.assignable = {
        update: {
          users: {
            deleteMany: {}
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

  const previousUserIds =
    shouldNotifyAssignment && existing.assignableId
      ? await getAssignableUserIds(existing.assignableId)
      : []

  const lead = await prisma.lead.update({
    where: { id },
    data,
    include: selectLeadForDisplay
  })

  if (shouldNotifyAssignment) {
    try {
      await notifyLeadAssigned(lead, user, { previousUserIds })
    } catch (error) {
      console.error('Failed to notify lead assigned', error)
    }
  }

  return lead
}
