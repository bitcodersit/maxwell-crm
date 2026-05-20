import { z } from 'zod'

export type TZUpsertCustomer = z.infer<typeof zUpsertCustomer>
export const zUpsertCustomer = z
  .object({
    id: z.number().nullish(),
    name: zName().nullish(),
    email: zEmail().nullish(),
    phone: zPhone().nullish()
  })
  .superRefine(async (data, ctx) => {
    if (!data.id && !data.phone && !data.email) {
      ctx.addIssue('Id, phone or email is required')
    }
  })
