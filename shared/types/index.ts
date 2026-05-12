export * from './User'
export * from './Role'
export * from './UserRole'
export * from './RolePermission'
export * from './Permission'
export * from './Team'
export * from './TeamMember'
export * from './Attachment'
export * from './Task'

export type TMaybe<T> = T | null | undefined

export type TPaginated<T> = {
  page: number
  total: number
  perPage: number
  totalPages: number
  firstPage: number
  lastPage: number
  nextPage: TMaybe<number>
  previousPage: TMaybe<number>
  hasNextPage: boolean
  hasPreviousPage: boolean
  fetchedAt?: number
  data: T[]
}
