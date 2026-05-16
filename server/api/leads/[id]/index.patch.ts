const zLeadPatch = z.object({
  status: z.enum(['Hot', 'Warm', 'Cold', 'Not Interested', 'Closed']).optional(),
  followUpDate: z.string().nullish(),
  assignedSalesman: z.string().nullish(),
  notes: z.string().nullish()
})

export default defineEventHandler(async event => {
  await requireUserSession(event)
  const id = Number(getRouterParam(event, 'id'))
  if (!id) throw err.notFound()
  const body = await readBody(event)
  const input = await validate(body, zLeadPatch)
  return upsertLead({ id, ...input })
})
