import type { Attachable, Attachment } from '~~/prisma/client/client'

export type TAttachment = Attachment & {
  users?: TMaybe<TUser[]>
  teams?: TMaybe<TTeam[]>
  attachable?: TMaybe<TAttachable>
}

export type TAttachable = Attachable & {
  task?: TMaybe<TTask>
  lead?: TMaybe<TLead>
  property?: TMaybe<TProperty>
  attachments?: TMaybe<TAttachment[]>
}
