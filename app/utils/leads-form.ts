import { LeadStatus } from '~~/prisma/client/enums'
import type { TLead } from '~~/shared/types/Lead'

export type TLeadFormCustomer = {
  id: number
  name?: string
  phone?: string | null
  email?: string | null
}

export type TLeadFormState = {
  status: LeadStatus
  customer: TLeadFormCustomer | null
  customerPhone: string
  customerEmail: string
  source: unknown
  propertyTypeMain: unknown
  propertyTypeSub: unknown
  area: string
  block: string
  road: string
  addressLine1: string
  budgetMin: string
  budgetMax: string
  assignedUsers: Array<{ id: number; name?: string }>
  assignedTeams: Array<{ id: number; name?: string }>
}

export function pickLeadOptionId(value: unknown): number | undefined {
  if (value == null || value === '') return undefined
  if (typeof value === 'number' && Number.isInteger(value) && value > 0) return value
  if (typeof value === 'object' && value !== null && 'id' in value) {
    const id = Number((value as { id: unknown }).id)
    return Number.isInteger(id) && id > 0 ? id : undefined
  }
  return undefined
}

export function parseOptionalPositiveNumber(
  value: string | number | null | undefined
): number | undefined {
  if (value == null || value === '') return undefined
  if (typeof value === 'number') {
    return Number.isFinite(value) && value > 0 ? value : undefined
  }
  const trimmed = String(value).trim()
  if (!trimmed) return undefined
  const n = Number(trimmed)
  if (!Number.isFinite(n) || n <= 0) return undefined
  return n
}

export function createEmptyLeadFormState(): TLeadFormState {
  return {
    status: LeadStatus.New,
    customer: null,
    customerPhone: '',
    customerEmail: '',
    source: null,
    propertyTypeMain: null,
    propertyTypeSub: null,
    area: '',
    block: '',
    road: '',
    addressLine1: '',
    budgetMin: '',
    budgetMax: '',
    assignedUsers: [],
    assignedTeams: []
  }
}

export function leadToFormState(lead?: TLead): TLeadFormState {
  const customer = lead?.customer
  return {
    status: lead?.status ?? LeadStatus.New,
    customer: customer
      ? {
          id: customer.id,
          name: customer.name,
          phone: customer.phone,
          email: customer.email
        }
      : null,
    customerPhone: customer?.phone ?? '',
    customerEmail: customer?.email ?? '',
    source: lead?.source ?? null,
    propertyTypeMain: lead?.propertyTypeMain ?? null,
    propertyTypeSub: lead?.propertyTypeSub ?? null,
    area: lead?.address?.name ?? '',
    block: lead?.address?.block ?? '',
    road: lead?.address?.road ?? '',
    addressLine1: lead?.address?.addressLine1 ?? '',
    budgetMin: lead?.budgetMin != null ? String(lead.budgetMin) : '',
    budgetMax: lead?.budgetMax != null ? String(lead.budgetMax) : '',
    assignedUsers: (lead?.assignable?.users ?? [])
      .map(row => row.user)
      .filter((user): user is NonNullable<typeof user> => !!user),
    assignedTeams: (lead?.assignable?.teams ?? [])
      .map(row => row.team)
      .filter((team): team is NonNullable<typeof team> => !!team)
  }
}

export function applyCustomerToFormState(
  state: TLeadFormState,
  customer: TLeadFormCustomer | null
) {
  state.customer = customer
  state.customerPhone = customer?.phone ?? ''
  state.customerEmail = customer?.email ?? ''
}

function buildAddressPayload(state: TLeadFormState) {
  const area = state.area.trim()
  const block = state.block.trim()
  const road = state.road.trim()
  const addressLine1 = state.addressLine1.trim()

  if (!area && !block && !road && !addressLine1) return undefined

  const line =
    addressLine1 || area || [block, road].filter(Boolean).join(', ').trim() || undefined
  if (!line) return undefined

  return {
    name: area || undefined,
    addressLine1: line,
    road: road || '',
    block: block || ''
  }
}

export function toLeadCreatePayload(state: TLeadFormState) {
  const customerId = pickLeadOptionId(state.customer)

  return {
    status: state.status,
    budgetMin: parseOptionalPositiveNumber(state.budgetMin),
    budgetMax: parseOptionalPositiveNumber(state.budgetMax),
    sourceId: pickLeadOptionId(state.source),
    propertyTypeMainId: pickLeadOptionId(state.propertyTypeMain),
    propertyTypeSubId: pickLeadOptionId(state.propertyTypeSub),
    userIds: state.assignedUsers.map(user => user.id).filter(Boolean),
    teamIds: state.assignedTeams.map(team => team.id).filter(Boolean),
    ...(customerId ? { customerId } : {}),
    address: buildAddressPayload(state)
  }
}

export function toLeadUpdatePayload(state: TLeadFormState, lead?: TLead) {
  const address = buildAddressPayload(state)
  const customerId = pickLeadOptionId(state.customer)

  return {
    status: state.status,
    budgetMin: parseOptionalPositiveNumber(state.budgetMin),
    budgetMax: parseOptionalPositiveNumber(state.budgetMax),
    sourceId: pickLeadOptionId(state.source),
    propertyTypeMainId: pickLeadOptionId(state.propertyTypeMain),
    propertyTypeSubId: pickLeadOptionId(state.propertyTypeSub),
    userIds: state.assignedUsers.map(user => user.id),
    teamIds: state.assignedTeams.map(team => team.id),
    // Always send so clearing the dropdown unlinks the customer
    customerId: customerId ?? null,
    ...(address
      ? {
          address: {
            ...address,
            id: lead?.addressId ?? lead?.address?.id
          }
        }
      : {})
  }
}
