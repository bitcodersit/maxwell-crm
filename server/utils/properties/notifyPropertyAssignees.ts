import { createNotification, getAssignableUserIds } from '../notifications'

type TPropertyNotifyTarget = {
  id: number
  sid: string
  name: string
  assignableId?: number | null
}

type TActor = Pick<TUser, 'id' | 'name'>

const propertyHref = (property: TPropertyNotifyTarget) => `/properties/${property.id}`

export const notifyPropertyCreated = async (
  property: TPropertyNotifyTarget,
  actor: TActor
) => {
  return createNotification({
    type: 'PROPERTY_CREATED',
    title: 'New property created',
    body: `${actor.name} created property ${property.name} (${property.sid})`,
    actorId: actor.id,
    subjectType: 'PROPERTY',
    subjectId: property.id,
    assignableId: property.assignableId,
    data: {
      sid: property.sid,
      name: property.name,
      href: propertyHref(property)
    }
  })
}

export const notifyPropertyAssigned = async (
  property: TPropertyNotifyTarget,
  actor: TActor,
  options?: {
    previousUserIds?: number[]
  }
) => {
  if (!property.assignableId) return null

  const currentUserIds = await getAssignableUserIds(property.assignableId)
  const previousUserIds = new Set(options?.previousUserIds ?? [])
  const newlyAssignedIds = currentUserIds.filter(id => !previousUserIds.has(id))

  if (!newlyAssignedIds.length) return null

  return createNotification({
    type: 'PROPERTY_ASSIGNED',
    title: 'Property assigned',
    body: `${actor.name} assigned property ${property.name} (${property.sid})`,
    actorId: actor.id,
    subjectType: 'PROPERTY',
    subjectId: property.id,
    recipientIds: newlyAssignedIds,
    includeAdmins: true,
    data: {
      sid: property.sid,
      name: property.name,
      href: propertyHref(property)
    }
  })
}
