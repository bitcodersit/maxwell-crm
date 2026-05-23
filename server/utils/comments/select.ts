import { selectAttachmentForCard } from '../attachments/select'
import { selectUserForBadge } from '../users'

export const selectComment = () => {
  return {
    select: {
      id: true,
      text: true,
      author: selectUserForBadge,
      attachable: {
        select: {
          attachments: selectAttachmentForCard
        }
      }
    }
  }
}
