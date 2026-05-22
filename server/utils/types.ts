/* eslint-disable no-unused-vars */
export type { Prisma } from '~~/prisma/client/client'
export type { z } from 'zod'

export type TQuery = Record<string, unknown>

export type TScopeFn<T> = (where: T, user: TUser) => T

export type TSelectParams = {
  user?: TUser
  options?: TMaybe<boolean>
}
