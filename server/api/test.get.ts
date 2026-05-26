import z from 'zod'
import { zArray, zBoolean, zDateObject, zFalse, zTrue } from '../utils/zod'

type TZTest = z.infer<typeof zTest>
export const zTest = z
  .object({
    id: zId().nullish(),
    ids: zIds().nullish(),
    true: zTrue().nullish(),
    false: zFalse().nullish(),
    isDefault: zBoolean().default(true),
    names: zArray(z.array(z.string()).nullish()),
    date: zDateObject().nullish(),
    year: z.array(zDate()).nullish(),
    orderBy: zOrderByRecord(['id', 'name', 'email', 'phone', 'creatorId', 'createdAt', 'updatedAt'])
  })
  .and(zPagination())

export default defineEventHandler(async event => {
  const query = getQuery(event)
  const input = await validate(query, zTest)
  console.log(input)
  return await validate(query, zTest)
})
