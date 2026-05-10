import type { Attachable, Attachment } from '~~/prisma/client/client'

export type TAttachment = Attachment & {
  users?: TUser[]
  teams?: TTeam[]
  attachables?: TAttachable[]
}

export type TAttachable = Attachable & {
  attachment?: TAttachment
  task?: TTask
}
