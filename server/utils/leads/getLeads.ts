import type { H3Event } from 'h3'
import { endOfDay, startOfDay } from 'date-fns'
import { z } from 'zod'

const leadStatusValues = ['New', 'Hot', 'Warm', 'Cold', 'Not_Interested', 'Closed'] as const
const dateModes = ['lt', 'lte', 'eq', 'gte', 'gt', 'before', 'after', 'exact', 'single'] as const

const zTextMode = z.enum(['contains', 'exact']).default('contains')
const zDateMode = z.enum(dateModes).default('eq')

const zOptionalText = z.preprocess(value => {
  if (typeof value !== 'string') return value
  const normalized = value.trim()
  return normalized || undefined
}, z.string().optional())

const zOptionalNumber = z.preprocess(value => {
  if (value === undefined || value === null || value === '') return undefined
  const n = Number(value)
  return Number.isFinite(n) && n >= 0 ? n : undefined
}, z.number().nonnegative().optional())

const zIdArray = z.preprocess(value => {
  const values = Array.isArray(value)
    ? value
    : value === undefined || value === null || value === ''
      ? []
      : String(value)
          .split(',')
          .map(item => item.trim())
          .filter(Boolean)
  const ids = values.map(item => Number(item)).filter(id => Number.isInteger(id) && id > 0)
  return ids.length ? ids : undefined
}, z.array(z.number().int().positive()).optional())

const zLeadStatusArray = z.preprocess(
  value => {
    const values = Array.isArray(value)
      ? value
      : value === undefined || value === null || value === ''
        ? []
        : String(value)
            .split(',')
            .map(item => item.trim())
            .filter(Boolean)
    const statuses = values
      .map(item => item.replace(/\s+/g, '_'))
      .filter(item => leadStatusValues.includes(item as (typeof leadStatusValues)[number]))
    return statuses.length ? statuses : undefined
  },
  z.array(z.enum(leadStatusValues)).optional()
)

const zGetLeadsFilter = z
  .object({
    q: zOptionalText,
    id: zIdArray,
    sid: zOptionalText,
    creatorId: zIdArray,
    customerId: zIdArray,
    sourceId: zIdArray,
    propertyTypeMainId: zIdArray,
    propertyTypeSubId: zIdArray,
    users: zIdArray,
    teams: zIdArray,
    status: zLeadStatusArray,
    source: zOptionalText,
    sourceMode: zTextMode,
    area: zOptionalText,
    areaMode: zTextMode,
    assignedSalesman: zOptionalText,
    assignedSalesmanMode: zTextMode,
    budgetMin: zOptionalNumber,
    budgetMax: zOptionalNumber,
    createdAt: zOptionalText,
    createdAtMode: zDateMode,
    updatedAt: zOptionalText,
    updatedAtMode: zDateMode,
    options: z.preprocess(
      value => (value === undefined ? false : isTrue(value)),
      z.boolean().default(false)
    ),
    orderBy: zOrderByRecord([
      'id',
      'sid',
      'status',
      'creatorId',
      'customerId',
      'createdAt',
      'updatedAt'
    ])
  })
  .and(zPagination())

export type TZGetLeads = z.infer<typeof zGetLeads>
export const zGetLeads = zGetLeadsFilter

const normalizeSingleDateMode = (raw: (typeof dateModes)[number]) => {
  if (raw === 'single' || raw === 'exact') return 'eq'
  if (raw === 'before') return 'lt'
  if (raw === 'after') return 'gt'
  return raw
}

const getDateFilter = (value: string, rawMode: (typeof dateModes)[number]) => {
  const mode = normalizeSingleDateMode(rawMode)
  const [start, end] = value.split(',').map(v => v.trim())
  if (!start) return undefined

  if (start && end) {
    return {
      gte: startOfDay(new Date(start)),
      lte: endOfDay(new Date(end))
    }
  }

  const dayStart = startOfDay(new Date(start))
  const dayEnd = endOfDay(new Date(start))

  if (mode === 'lt') return { lt: dayStart }
  if (mode === 'lte') return { lte: dayEnd }
  if (mode === 'gt') return { gt: dayEnd }
  if (mode === 'gte') return { gte: dayStart }
  return { gte: dayStart, lte: dayEnd }
}

const getTextFilter = (text: string, mode: z.infer<typeof zTextMode>) => {
  if (mode === 'exact') {
    return {
      equals: text
    }
  }
  return {
    contains: text
  }
}

const getLeadOrderBy = (input: TZGetLeads) => {
  const { orderBy } = getOrderBy(input, { createdAt: 'desc' })
  const rows = Array.isArray(orderBy) ? orderBy.filter(Boolean) : orderBy ? [orderBy] : []
  const mapped = rows.flatMap(row => {
    return Object.entries(row || {}).flatMap(([key, direction]) => {
      if (direction !== 'asc' && direction !== 'desc') return []
      if (key === 'serialCode')
        return [{ sid: direction } satisfies Prisma.LeadOrderByWithRelationInput]
      if (key === 'customerName')
        return [{ customer: { name: direction } } satisfies Prisma.LeadOrderByWithRelationInput]
      if (key === 'source')
        return [{ source: { name: direction } } satisfies Prisma.LeadOrderByWithRelationInput]
      if (key === 'propertyTypeMain')
        return [
          { propertyTypeMain: { name: direction } } satisfies Prisma.LeadOrderByWithRelationInput
        ]
      if (key === 'budgetRange')
        return [{ budgetMin: direction } satisfies Prisma.LeadOrderByWithRelationInput]
      if (key === 'assignedSalesman')
        return [{ updatedAt: direction } satisfies Prisma.LeadOrderByWithRelationInput]
      if (
        ['id', 'sid', 'status', 'creatorId', 'customerId', 'createdAt', 'updatedAt'].includes(key)
      ) {
        return [{ [key]: direction } as Prisma.LeadOrderByWithRelationInput]
      }
      return []
    })
  })
  return mapped.length
    ? mapped
    : [{ createdAt: 'desc' } satisfies Prisma.LeadOrderByWithRelationInput]
}

export const getLeadWhere = (input: TZGetLeads): Prisma.LeadWhereInput => {
  const and: Prisma.LeadWhereInput[] = [{ deletedAt: null }]

  if (input.id?.length) and.push({ id: { in: input.id } })
  if (input.sid) and.push({ sid: getTextFilter(input.sid, 'contains') })
  if (input.creatorId?.length) and.push({ creatorId: { in: input.creatorId } })
  if (input.customerId?.length) and.push({ customerId: { in: input.customerId } })
  if (input.sourceId?.length) and.push({ sourceId: { in: input.sourceId } })
  if (input.propertyTypeMainId?.length)
    and.push({ propertyTypeMainId: { in: input.propertyTypeMainId } })
  if (input.propertyTypeSubId?.length)
    and.push({ propertyTypeSubId: { in: input.propertyTypeSubId } })
  if (input.users?.length) {
    and.push({
      assignable: {
        users: {
          some: {
            userId: { in: input.users }
          }
        }
      }
    })
  }
  if (input.teams?.length) {
    and.push({
      assignable: {
        teams: {
          some: {
            teamId: { in: input.teams }
          }
        }
      }
    })
  }
  if (input.status?.length) and.push({ status: { in: input.status } })
  if (input.source) {
    and.push({
      source: {
        name: getTextFilter(input.source, input.sourceMode)
      }
    })
  }
  if (input.area) {
    const areaFilter = getTextFilter(input.area, input.areaMode)
    and.push({
      address: {
        OR: [
          { name: areaFilter },
          { addressLine1: areaFilter },
          { road: areaFilter },
          { block: areaFilter }
        ]
      }
    })
  }
  if (input.assignedSalesman) {
    const nameFilter = getTextFilter(input.assignedSalesman, input.assignedSalesmanMode)
    and.push({
      assignable: {
        OR: [
          {
            users: {
              some: {
                user: {
                  name: nameFilter
                }
              }
            }
          },
          {
            teams: {
              some: {
                team: {
                  members: {
                    some: {
                      user: {
                        name: nameFilter
                      }
                    }
                  }
                }
              }
            }
          }
        ]
      }
    })
  }
  // Overlap lead budget range with filter range (leads with no budget are excluded)
  if (input.budgetMin != null) {
    and.push({
      OR: [
        { budgetMax: { gte: input.budgetMin } },
        { AND: [{ budgetMax: null }, { budgetMin: { gte: input.budgetMin } }] }
      ]
    })
  }
  if (input.budgetMax != null) {
    and.push({
      OR: [
        { budgetMin: { lte: input.budgetMax } },
        { AND: [{ budgetMin: null }, { budgetMax: { lte: input.budgetMax } }] }
      ]
    })
  }
  if (input.createdAt) {
    const createdAt = getDateFilter(input.createdAt, input.createdAtMode)
    if (createdAt) and.push({ createdAt })
  }
  if (input.updatedAt) {
    const updatedAt = getDateFilter(input.updatedAt, input.updatedAtMode)
    if (updatedAt) and.push({ updatedAt })
  }
  if (input.q) {
    const filter = getTextFilter(input.q, 'contains')
    and.push({
      OR: [
        { sid: filter },
        { customer: { name: filter } },
        { customer: { phone: filter } },
        { source: { name: filter } },
        { address: { addressLine1: filter } }
      ]
    })
  }

  return and.length > 1 ? { AND: and } : and[0]
}

export const getLeads = async (event: H3Event, input: TZGetLeads) => {
  const user = await getCurrentUser(event)
  if (!user.readAnyLeads && !user.readOwnLeads) {
    return {
      error: err.denied()
    }
  }

  const scopedWhere = getLeadScopedWhere(user, getLeadWhere(input))
  const { take, skip, paginate } = getPagination(input)
  const orderBy = getLeadOrderBy(input)

  const [total, leads] = input.options
    ? await prisma.$transaction([
        prisma.lead.count({ where: scopedWhere }),
        prisma.lead.findMany({
          where: scopedWhere,
          skip,
          take,
          orderBy,
          select: {
            id: true,
            sid: true,
            status: true
          }
        })
      ])
    : await prisma.$transaction([
        prisma.lead.count({ where: scopedWhere }),
        prisma.lead.findMany({
          where: scopedWhere,
          skip,
          take,
          orderBy,
          include: selectLeadForDisplay
        })
      ])

  return {
    data: paginate(leads, total)
  }
}
