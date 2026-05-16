const zLead = z.object({
  id: z.number().nullish(),
  source: z.enum(['Facebook', 'Website', 'Phone', 'Referral', 'Walk-in']).default('Facebook'),
  customerName: z.string().min(1),
  phone: z.string().min(1),
  area: z.string().nullish(),
  propertyTypeMain: z.enum(['Land', 'Land Share', 'Commercial Plot']).default('Land'),
  propertyTypeSub: z.enum(['Ready', 'Ongoing', 'Installment']).default('Ready'),
  block: z.string().nullish(),
  road: z.string().nullish(),
  budgetRange: z.string().nullish(),
  status: z.enum(['Hot', 'Warm', 'Cold', 'Not Interested', 'Closed']).default('Warm'),
  assignedSalesman: z.string().nullish(),
  followUpDate: z.string().nullish(),
  notes: z.string().nullish()
})

export default defineEventHandler(async event => {
  await requireUserSession(event)
  const body = await readBody(event)
  const input = await validate(body, zLead)
  return upsertLead({
    ...input,
    id: input.id ?? undefined
  })
})
