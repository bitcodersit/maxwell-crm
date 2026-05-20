import { getLeads, zGetLeads } from '~~/server/utils/leads'

export default defineEventHandler(async event => {
  const query = getQuery(event)
  const input = await validate(query, zGetLeads)
  const { error, data } = await getLeads(event, input)
  if (error) throw error
  return data
})
