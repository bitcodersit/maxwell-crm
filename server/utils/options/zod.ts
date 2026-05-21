import { z } from 'zod'
import { OptionType } from '~~/prisma/client/enums'

export type TZGetOptions = z.infer<typeof zGetOptions>
export const zGetOptions = z
  .object({
    q: z.string().nullish(),
    type: z.enum(OptionType)
  })
  .and(zOrderable({ name: 'asc' }))
  .and(zPagination())
