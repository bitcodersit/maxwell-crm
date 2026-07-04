import { selectAttachmentForCard } from '../attachments/select'
import { selectUserForDisplay } from '../users/select'

export const selectPropertyForDisplay = {
  purchaseType: {
    select: {
      id: true,
      name: true
    }
  },
  address: true,
  sizes: {
    include: {
      size: {
        select: {
          id: true,
          name: true
        }
      }
    }
  },
  attachable: {
    select: {
      attachments: selectAttachmentForCard
    }
  },
  assignable: {
    include: {
      users: {
        include: {
          user: selectUserForDisplay
        }
      }
    }
  }
} as const
