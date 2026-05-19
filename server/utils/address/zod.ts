import { z } from 'zod'

export type TZAddress = z.infer<typeof zAddress>
export const zAddress = z.object({
  name: z.string().nullish(),
  addressLine1: z.string().min(1, 'Location is required!'),
  road: z.string().nullish(),
  block: z.string().nullish()
})
