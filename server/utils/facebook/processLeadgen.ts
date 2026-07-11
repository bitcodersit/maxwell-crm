import type { TFacebookLeadgenValue } from './types'
import { fetchFacebookLead } from './fetchLead'
import { mapFacebookLeadFields } from './mapLeadFields'

const FACEBOOK_SOURCE_NAME = 'Facebook'
const FACEBOOK_EXTERNAL_SOURCE = 'facebook'

let cachedFacebookSourceId: number | null | undefined

const getFacebookSourceId = async () => {
  if (cachedFacebookSourceId !== undefined) {
    return cachedFacebookSourceId
  }

  const option = await prisma.option.findFirst({
    where: {
      type: 'SOURCE',
      name: FACEBOOK_SOURCE_NAME,
      deletedAt: null
    },
    select: { id: true }
  })

  cachedFacebookSourceId = option?.id ?? null
  return cachedFacebookSourceId
}

const findExistingFacebookLead = async (leadgenId: string) => {
  return prisma.lead.findFirst({
    where: {
      externalSource: FACEBOOK_EXTERNAL_SOURCE,
      externalId: leadgenId,
      deletedAt: null
    },
    select: { id: true, sid: true }
  })
}

const addLeadImportComment = async (commentableId: number, text: string) => {
  await prisma.comment.create({
    data: {
      text,
      commentable: { connect: { id: commentableId } },
      attachable: { create: {} }
    }
  })
}

export const processFacebookLeadgen = async (
  value: TFacebookLeadgenValue,
  pageAccessToken: string
) => {
  const leadgenId = String(value.leadgen_id)
  const existingLead = await findExistingFacebookLead(leadgenId)

  if (existingLead) {
    return {
      status: 'skipped' as const,
      reason: 'duplicate',
      leadId: existingLead.id,
      sid: existingLead.sid
    }
  }

  const facebookLead = await fetchFacebookLead(leadgenId, pageAccessToken)
  const mapped = mapFacebookLeadFields(facebookLead)

  if (!mapped.customer.name && !mapped.customer.email && !mapped.customer.phone) {
    throw err.unprocessable({
      customer: { errors: ['Facebook lead is missing name, email, and phone'] }
    })
  }

  const sourceId = await getFacebookSourceId()

  const lead = await createLead({
    status: 'New',
    userIds: [],
    teamIds: [],
    sourceId: sourceId ?? undefined,
    customer: {
      name: mapped.customer.name ?? undefined,
      email: mapped.customer.email ?? undefined,
      phone: mapped.customer.phone as TZUpsertCustomer['phone']
    },
    address: mapped.address
      ? {
          name: mapped.address.name,
          addressLine1: mapped.address.addressLine1,
          road: mapped.address.road ?? '',
          block: mapped.address.block ?? ''
        }
      : undefined,
    externalSource: FACEBOOK_EXTERNAL_SOURCE,
    externalId: leadgenId
  })

  if (mapped.commentLines.length && lead.commentableId) {
    await addLeadImportComment(lead.commentableId, mapped.commentLines.join('\n'))
  }

  return {
    status: 'created' as const,
    leadId: lead.id,
    sid: lead.sid
  }
}
