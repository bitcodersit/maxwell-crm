import { zOrderable } from '../utils/zOrderBy'

export const zTest = z
  .object({
    //
  })
  .and(zPagination())
  .and(zOrderable())

export default defineEventHandler(async event => {
  const query = getQuery(event)
  return await validate(query, zTest)
})
