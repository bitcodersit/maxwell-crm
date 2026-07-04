import type { Lead, LeadProperty } from '~~/prisma/client/client'

export type TLead = Lead & {
  creator?: TMaybe<TUser>
  assignable?: TMaybe<TAssignable>
  address?: TMaybe<TAddress>
  source?: TMaybe<TOption>
  customer?: TMaybe<TUser>
  propertyTypeMain?: TMaybe<TOption>
  propertyTypeSub?: TMaybe<TOption>
  properties?: TMaybe<TLeadProperty[]>
  boardItems?: TMaybe<TBoardItem[]>
  attachable?: TMaybe<TAttachable>
  commentable?: TMaybe<TCommentable>
  attachables?: TMaybe<TAttachable[]>
}

export type TLeadProperty = LeadProperty & {
  lead?: TMaybe<TLead>
  property?: TMaybe<TProperty>
}
