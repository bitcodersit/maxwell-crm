export const selectFollowUp = () => {
  return {
    select: {
      id: true,
      leadId: true,
      date: true,
      type: true,
      status: true,
      outcome: true,
      nextDate: true,
      author: selectUserForBadge,
      attachable: {
        select: {
          attachments: selectAttachmentForCard
        }
      },
      commentable: {
        select: {
          comments: selectComment()
        }
      }
    }
  }
}
