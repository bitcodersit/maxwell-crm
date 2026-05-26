import { z } from 'zod'

export type TZUpsertAddress = z.infer<typeof zUpsertAddress>
export const zUpsertAddress = z.object({
  id: zId().nullish(),
  name: z.string().nullish(),
  addressLine1: z.string().min(1, 'Location is required!'),
  road: z.string().default(''),
  block: z.string().default(''),
  addressableId: zId().nullish()
})
