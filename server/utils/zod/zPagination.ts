import { z } from 'zod'

type TOptions = {
  page: number
  perPage: number
  paginate: boolean
}

export type TZPagination = z.infer<typeof zPagination>
export const zPagination = (options?: TOptions) => {
  return z.object({
    page: zId('Invalid page').default(options?.page ?? 1),
    perPage: zId('Invalid per page').default(options?.perPage ?? 10),
    paginate: zBoolean().default(options?.paginate ?? true)
  })
}
