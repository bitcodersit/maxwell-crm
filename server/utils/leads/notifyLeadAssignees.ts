import { createNotification, getAssignableUserIds } from '../notifications'

type TLeadNotifyTarget = {
  id: number
  sid: string
  assignableId?: number | null
}

type TActor = Pick<TUser, 'id' | 'name'>

const leadHref = (lead: TLeadNotifyTarget) => `/leads/${lead.sid}`

export const notifyLeadCreated = async (lead: TLeadNotifyTarget, actor: TActor) => {
  return createNotification({
    type: 'LEAD_CREATED',
    title: 'New lead created',
    body: `${actor.name} created lead ${lead.sid}`,
    actorId: actor.id,
    subjectType: 'LEAD',
    subjectId: lead.id,
    assignableId: lead.assignableId,
    data: {
      sid: lead.sid,
      href: leadHref(lead)
    }
  })
}

export const notifyLeadAssigned = async (
  lead: TLeadNotifyTarget,
  actor: TActor,
  options?: {
    previousUserIds?: number[]
  }
) => {
  if (!lead.assignableId) return null

  const currentUserIds = await getAssignableUserIds(lead.assignableId)
  const previousUserIds = new Set(options?.previousUserIds ?? [])
  const newlyAssignedIds = currentUserIds.filter(id => !previousUserIds.has(id))

  if (!newlyAssignedIds.length) return null

  return createNotification({
    type: 'LEAD_ASSIGNED',
    title: 'Lead assigned',
    body: `${actor.name} assigned lead ${lead.sid}`,
    actorId: actor.id,
    subjectType: 'LEAD',
    subjectId: lead.id,
    recipientIds: newlyAssignedIds,
    includeAdmins: true,
    data: {
      sid: lead.sid,
      href: leadHref(lead)
    }
  })
}

/** @deprecated Prefer notifyLeadAssigned / notifyLeadCreated */
export const notifyLeadAssignees = notifyLeadAssigned
