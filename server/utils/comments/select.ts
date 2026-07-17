import { selectAttachmentForCard } from '../attachments/select'
import { selectUserForBadge } from '../users'

export const selectComment = () => {
  return {
    select: {
      id: true,
      authorId: true,
      text: true,
      createdAt: true,
      author: selectUserForBadge,
      attachable: {
        select: {
          attachments: selectAttachmentForCard
        }
      }
    }
  }
}
