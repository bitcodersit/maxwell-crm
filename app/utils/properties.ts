import type { TProperty } from '~~/shared/types/Property'

export type TPropertyStatus = 'Available' | 'Hold' | 'Sold'

export type TPropertyFormState = {
  id?: number
  attachableId?: number | null
  name: string
  facing: string
  price?: number
  previousPrice?: number
  status: TPropertyStatus
  purchaseType: unknown
  katha?: number
  sqft?: number
  addressId?: number
  addressLine1: string
  road: string
  block: string
  assignedUsers: Array<{ id: number; name?: string }>
  _original?: Record<string, unknown>
}

export function formatPropertyPrice(n: number) {
  if (n >= 10000000) return `${(n / 10000000).toFixed(1)} Cr`
  if (n >= 100000) return `${(n / 100000).toFixed(1)} Lac`
  return n.toLocaleString()
}

const parseNumber = (val: unknown) => {
  if (val === undefined) return undefined
  if (val === null || val === '') return null
  const n = Number(val)
  return Number.isFinite(n) ? n : null
}

const toFormNumber = (val: unknown) => {
  const n = parseNumber(val)
  return n === null ? undefined : n
}

export function createEmptyPropertyFormState(): TPropertyFormState {
  return {
    name: '',
    facing: '',
    status: 'Available',
    purchaseType: null,
    addressLine1: '',
    road: '',
    block: '',
    assignedUsers: []
  }
}

export function propertyToFormState(property?: TProperty): TPropertyFormState {
  const state: TPropertyFormState = {
    id: property?.id,
    attachableId: property?.attachableId,
    name: property?.name ?? '',
    facing: property?.facing ?? '',
    price: toFormNumber(property?.price),
    previousPrice: toFormNumber(property?.previousPrice),
    status: (property?.status as TPropertyStatus) ?? 'Available',
    purchaseType: property?.purchaseType ?? null,
    katha: toFormNumber(property?.sizes?.find(item => item.size?.name === 'Katha')?.sizeValue),
    sqft: toFormNumber(property?.sizes?.find(item => item.size?.name === 'Sqft')?.sizeValue),
    addressId: property?.addressId,
    addressLine1: property?.address?.addressLine1 ?? '',
    road: property?.address?.road ?? '',
    block: property?.address?.block ?? '',
    assignedUsers: (property?.assignable?.users ?? [])
      .map(item => item.user)
      .filter((user): user is NonNullable<typeof user> => !!user)
  }
  state._original = toPropertyComparable(state)
  return state
}

export function toPropertyComparable(v: TPropertyFormState | Record<string, unknown>) {
  const purchaseTypeId = (v.purchaseType as { id?: number } | null | undefined)?.id
  const addressLine1 = String(v.addressLine1 ?? '').trim()
  const road = String(v.road ?? '').trim()
  const block = String(v.block ?? '').trim()
  const addressId = typeof v.addressId === 'number' ? v.addressId : undefined
  const assignedUsers = Array.isArray(v.assignedUsers) ? v.assignedUsers : []
  const userIds = assignedUsers
    .map(user => (user as { id?: number }).id)
    .filter((id): id is number => typeof id === 'number')
    .sort((a, b) => a - b)

  return {
    name: String(v.name ?? ''),
    facing: (v.facing as string | null | undefined) || undefined,
    price: parseNumber(v.price),
    previousPrice: parseNumber(v.previousPrice),
    status: String(v.status ?? 'Available'),
    purchaseTypeId: typeof purchaseTypeId === 'number' ? purchaseTypeId : null,
    katha: parseNumber(v.katha),
    sqft: parseNumber(v.sqft),
    addressId,
    userIds,
    address: addressLine1
      ? {
          id: addressId,
          addressLine1,
          road,
          block
        }
      : undefined
  }
}

export function toPropertyPostPayload(v: TPropertyFormState) {
  const comparable = toPropertyComparable(v)
  return {
    ...comparable,
    price: comparable.price ?? 0,
    previousPrice: comparable.previousPrice,
    purchaseTypeId: comparable.purchaseTypeId ?? undefined,
    katha: comparable.katha ?? 0,
    sqft: comparable.sqft ?? 0,
    userIds: comparable.userIds
  }
}

const isSameValue = (a: unknown, b: unknown) => {
  if (a == null && b == null) return true
  if (typeof a === 'number' && typeof b === 'number') return a === b
  if (Array.isArray(a) && Array.isArray(b)) {
    return JSON.stringify(a) === JSON.stringify(b)
  }
  if (typeof a === 'object' && a !== null && typeof b === 'object' && b !== null) {
    return JSON.stringify(a) === JSON.stringify(b)
  }
  return a === b
}

export function toPropertyPatchPayload(v: TPropertyFormState) {
  const payload = toPropertyComparable(v)
  const original = v._original ?? {}
  const changed: Record<string, unknown> = {}
  for (const key of Object.keys(payload) as (keyof typeof payload)[]) {
    if (!isSameValue(payload[key], original[key as string])) {
      changed[key] = payload[key]
    }
  }
  return changed
}
