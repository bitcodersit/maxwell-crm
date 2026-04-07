export * from './User'
export * from './Role'
export * from './UserRole'
export * from './RolePermission'
export * from './Permission'

export type TPaginated<T> = {
  page: number
  total: number
  perPage: number
  totalPages: number
  firstPage: number
  lastPage: number
  nextPage: number
  previousPage: number
  hasNextPage: boolean
  hasPreviousPage: boolean
  data: T[]
}
