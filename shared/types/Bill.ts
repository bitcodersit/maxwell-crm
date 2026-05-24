import type { Bill } from '~~/prisma/client/client'

export type TBill = Bill & {
  user?: TMaybe<TUser>
  author?: TMaybe<TUser>
  reviewer?: TMaybe<TUser>
  type?: TMaybe<TOption>
}
