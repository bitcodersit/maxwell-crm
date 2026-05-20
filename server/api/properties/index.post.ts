const zProperty = z.object({
  id: z.number().nullish(),
  title: z.string().min(1),
  project: z.string().min(1),
  area: z.string().min(1),
  block: z.string().nullish(),
  road: z.string().nullish(),
  face: z.string().nullish(),
  katha: z.coerce.number().default(0),
  sqft: z.coerce.number().default(0),
  currentPrice: z.coerce.number().default(0),
  previousPrice: z.coerce.number().nullish(),
  installment: z.coerce.boolean().default(false),
  status: z.enum(['Available', 'Hold', 'Sold']).default('Available'),
  purchaseType: z
    .enum(['Contracted for sale', 'Power Registration', 'Sab Kobla', 'Ongoing'])
    .default('Contracted for sale'),
  manager: z.string().nullish()
})

export default defineEventHandler(async event => {
  await getCurrentUser(event)
  const body = await readBody(event)
  const input = await validate(body, zProperty)
  return upsertProperty({
    ...input,
    id: input.id ?? undefined
  })
})
