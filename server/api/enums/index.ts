const enums = {
  LeadStatus,
  TaskPriority,
  TaskStatus,
  TaskItemStatus,
  BoardModule,
  VisitStatus,
  BillStatus,
  FollowUpType,
  FollowUpStatus
} as const

type TEnum = keyof typeof enums

export const zGetEnums = z
  .object({
    q: zString().nullish(),
    type: z.enum(Object.keys(enums) as TEnum[]),
    orderBy: zOrderByRecord(['id', 'name']).nullish()
  })
  .and(zPagination())

export default defineEventHandler(async event => {
  const input = await validate(getQuery(event), zGetEnums)
  const pagination = getPagination(input)

  const data = Object.values(enums[input.type])
    .map(name => ({ id: name, name }))
    .filter(item => {
      if (!input.q) return true
      return item.name.toLowerCase().includes(input.q.toLowerCase())
    })

  return pagination.paginate(data)
})
