export const zTest = z
  .object({
    id: zId().nullish(),
    ids: zIds().nullish()
  })
  .and(zPagination())
  .and(zOrderable())

export default defineEventHandler(async event => {
  const query = getQuery(event)
  return await validate(query, zTest)
})
