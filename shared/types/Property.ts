import type { Property, PropertySize } from '~~/prisma/client/client'

export type TPropertySize = PropertySize & {
  property?: TMaybe<TProperty>
  size?: TMaybe<TOption>
}

export type TProperty = Property & {
  creator?: TMaybe<TUser>
  assignable?: TMaybe<TAssignable>
  address?: TMaybe<TAddress>
  sizes?: TMaybe<TPropertySize[]>
  leads?: TMaybe<TLeadProperty[]>
  attachables?: TMaybe<TAttachable[]>
}
