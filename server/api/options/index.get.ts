import { getOptions, zGetOptions } from '~~/server/utils/options'

export default defineEventHandler(async event => {
  const query = getQuery(event)
  const input = await validate(query, zGetOptions)
  return await getOptions(input)
})
