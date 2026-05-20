import { z } from 'zod'
import { zOrderBy } from '../zOrderBy'
import { zPagination } from '../zPagination'
import { OptionType } from '~~/prisma/client/enums'

export type TZGetOptions = z.infer<typeof zGetOptions>
export const zGetOptions = z
  .object({
    q: z.string().nullish(),
    type: z.enum(OptionType)
  })
  .and(zOrderBy({ name: 'asc' }))
  .and(zPagination())
