import z from 'zod'
import { zArray, zBoolean, zFalse, zTrue } from '../utils/zod'

type TZTest = z.infer<typeof zTest>
export const zTest = z
  .object({
    id: zId().nullish(),
    ids: zIds().nullish(),
    true: zTrue().nullish(),
    false: zFalse().nullish(),
    isDefault: zBoolean().default(true),
    names: zArray(z.array(z.string()).nullish())
  })
  .and(zPagination())
  .and(zOrderable())

export default defineEventHandler(async event => {
  const query = getQuery(event)
  return await validate(query, zTest)
})
