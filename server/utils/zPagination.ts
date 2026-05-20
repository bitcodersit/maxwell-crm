import { z } from 'zod'

type TOptions = {
  page: number
  perPage: number
  paginate: boolean
}

export type TZPagination = z.infer<typeof zPagination>
export const zPagination = (options?: TOptions) => {
  return z.object({
    page: z.transform<number>(v => {
      const number = Number(v)
      return !isNaN(number) && number > 0 ? number : (options?.page ?? 1)
    }),
    perPage: z.transform<number>(v => {
      const number = Number(v)
      return !isNaN(number) && number > 0 ? number : (options?.perPage ?? 10)
    }),
    paginate: z.transform<boolean>(v => {
      return isTrue(v ?? options?.paginate ?? true)
    })
  })
}
