import { generateSid } from '~~/server/utils/generateSid'

const zUpdateLead = z.object({
  id: zId(),
  status: z.enum(LeadStatus).nullish()
})

const zCreateLead = z.object({
  status: z.enum(LeadStatus).default('New')
})

const zLead = z.union([zUpdateLead, zCreateLead])

export default defineEventHandler(async event => {
  const user = await getCurrentUser(event)
  const body = await readBody(event)
  const input = await validate(body, zLead)

  if ('id' in input) {
    const { id, ...rest } = input

    // Partial update
    const data: Prisma.LeadUpdateInput = {}
    if (rest.status) {
      data.status = rest.status
    }

    //
    return await prisma.lead.update({
      where: {
        id
      },
      data
    })
  }

  //
  const lead = await prisma.lead.create({
    data: {
      sid: generateSid().slice(0, 10),
      status: input.status,
      creatorId: user.id
    }
  })

  const boardItem = await assignLeadToTheBoard(lead.id)

  return {
    ...lead,
    boardItems: boardItem ? [boardItem] : []
  }
})
