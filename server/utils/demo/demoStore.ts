import type { TLead } from '~~/shared/types/Lead'
import type { TProperty } from '~~/shared/types/Property'
import { SEED_LEADS } from '~~/server/utils/demo/seedLeads'
import { SEED_PROPERTIES } from '~~/server/utils/demo/seedProperties'
import { filterList, nextSerialCode, sortList } from '~~/server/utils/demo/filterList'

const flattenOrderBy = (orderBy: unknown) => {
  if (Array.isArray(orderBy)) {
    return Object.assign({}, ...orderBy) as Record<string, 'asc' | 'desc'>
  }
  return (orderBy || {}) as Record<string, 'asc' | 'desc'>
}

const storage = useStorage('data')

const LEADS_KEY = 'crm:leads'
const PROPERTIES_KEY = 'crm:properties'

async function readItems<T>(key: string, seed: T[]): Promise<T[]> {
  const items = await storage.getItem<T[]>(key)
  if (!items?.length) {
    await storage.setItem(key, seed)
    return [...seed]
  }
  return items
}

async function writeItems<T>(key: string, items: T[]) {
  await storage.setItem(key, items)
}

export async function getAllLeads() {
  return readItems<TLead>(LEADS_KEY, SEED_LEADS)
}

export async function getAllProperties() {
  return readItems<TProperty>(PROPERTIES_KEY, SEED_PROPERTIES)
}

export async function queryLeads(query: Record<string, unknown>) {
  const { skip, take, paginate } = getPagination(query)
  const { orderBy: orderByRaw } = getOrderBy(query, { id: 'desc' })
  const orderBy = flattenOrderBy(orderByRaw)

  let items = await getAllLeads()
  items = filterList(items, query, {
    searchKeys: ['serialCode', 'customerName', 'phone', 'area', 'assignedSalesman'],
    textFilters: [
      { key: 'area', queryKey: 'area' },
      { key: 'budgetRange', queryKey: 'budgetRange' },
      { key: 'assignedSalesman', queryKey: 'assignedSalesman' }
    ],
    arrayFilters: [
      { key: 'status', queryKey: 'status' },
      { key: 'source', queryKey: 'source' }
    ]
  })
  items = sortList(items, orderBy)

  const total = items.length
  const data =
    skip != null && take != null ? items.slice(skip, skip + take) : items

  return paginate(data, total)
}

export async function queryProperties(query: Record<string, unknown>) {
  const { skip, take, paginate } = getPagination(query)
  const { orderBy: orderByRaw } = getOrderBy(query, { id: 'desc' })
  const orderBy = flattenOrderBy(orderByRaw)

  let items = await getAllProperties()
  items = filterList(items, query, {
    searchKeys: ['serialCode', 'title', 'project', 'area', 'manager'],
    textFilters: [
      { key: 'area', queryKey: 'area' },
      { key: 'project', queryKey: 'project' }
    ],
    arrayFilters: [{ key: 'status', queryKey: 'status' }]
  })
  items = sortList(items, orderBy)

  const total = items.length
  const data =
    skip != null && take != null ? items.slice(skip, skip + take) : items

  return paginate(data, total)
}

export async function upsertLead(input: Partial<TLead> & { id?: number }) {
  const items = await getAllLeads()
  const now = new Date().toISOString()

  if (input.id) {
    const index = items.findIndex(l => l.id === input.id)
    if (index === -1) throw err.notFound()
    const duplicate = items.find(
      l => l.id !== input.id && l.phone === input.phone && input.phone
    )
    if (duplicate) {
      throw err.unprocessable({
        phone: { errors: ['This phone number is already used by another lead'] }
      })
    }
    items[index] = {
      ...items[index],
      ...input,
      updatedAt: now
    } as TLead
    await writeItems(LEADS_KEY, items)
    return items[index]
  }

  const duplicate = items.find(l => l.phone === input.phone && input.phone)
  if (duplicate) {
    throw err.unprocessable({
      phone: { errors: ['This phone number is already used by another lead'] }
    })
  }

  const nextId = items.reduce((max, l) => Math.max(max, l.id), 0) + 1
  const lead: TLead = {
    id: nextId,
    serialCode: nextSerialCode('RL-', items),
    source: input.source || 'Facebook',
    customerName: input.customerName || '',
    phone: input.phone || '',
    area: input.area ?? null,
    propertyTypeMain: input.propertyTypeMain || 'Land',
    propertyTypeSub: input.propertyTypeSub || 'Ready',
    block: input.block ?? null,
    road: input.road ?? null,
    budgetRange: input.budgetRange ?? null,
    status: input.status || 'Warm',
    assignedSalesman: input.assignedSalesman ?? null,
    followUpDate: input.followUpDate ?? null,
    notes: input.notes ?? null,
    createdAt: now,
    updatedAt: now
  }
  items.unshift(lead)
  await writeItems(LEADS_KEY, items)
  return lead
}

export async function deleteLeads(ids: number[]) {
  const items = await getAllLeads()
  const remaining = items.filter(l => !ids.includes(l.id))
  if (remaining.length === items.length) throw err.notFound()
  await writeItems(LEADS_KEY, remaining)
  return { count: items.length - remaining.length }
}

export async function upsertProperty(input: Partial<TProperty> & { id?: number }) {
  const items = await getAllProperties()
  const now = new Date().toISOString()

  if (input.id) {
    const index = items.findIndex(p => p.id === input.id)
    if (index === -1) throw err.notFound()
    items[index] = {
      ...items[index],
      ...input,
      updatedAt: now
    } as TProperty
    await writeItems(PROPERTIES_KEY, items)
    return items[index]
  }

  const nextId = items.reduce((max, p) => Math.max(max, p.id), 0) + 1
  const property: TProperty = {
    id: nextId,
    serialCode: nextSerialCode('PROP-', items),
    title: input.title || '',
    project: input.project || '',
    area: input.area || '',
    block: input.block || '',
    road: input.road || '',
    face: input.face || '',
    katha: Number(input.katha) || 0,
    sqft: Number(input.sqft) || 0,
    currentPrice: Number(input.currentPrice) || 0,
    previousPrice: input.previousPrice != null ? Number(input.previousPrice) : null,
    installment: Boolean(input.installment),
    status: input.status || 'Available',
    purchaseType: input.purchaseType || 'Contracted for sale',
    manager: input.manager || '',
    createdAt: now,
    updatedAt: now
  }
  items.unshift(property)
  await writeItems(PROPERTIES_KEY, items)
  return property
}

export async function deleteProperties(ids: number[]) {
  const items = await getAllProperties()
  const remaining = items.filter(p => !ids.includes(p.id))
  if (remaining.length === items.length) throw err.notFound()
  await writeItems(PROPERTIES_KEY, remaining)
  return { count: items.length - remaining.length }
}
