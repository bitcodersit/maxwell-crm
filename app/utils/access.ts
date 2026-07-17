export function canEditLeadDetailRecord(user: TUser | null | undefined) {
  return !!user
}

export function canDeleteLeadDetailRecord(
  user: TUser | null | undefined,
  authorId: number | null | undefined,
  deleteAnyPermission?: boolean | null
) {
  if (!user) return false
  if (user.isSuperAdmin) return true
  if (deleteAnyPermission) return true
  return authorId != null && authorId === user.id
}

export function canDeleteAttachment(
  user: TUser | null | undefined,
  attachment: Pick<TAttachment, 'uploaderId'>
) {
  if (!user) return false
  if (user.isSuperAdmin) return true
  if (user.deleteAnyAttachments) return true
  return attachment.uploaderId != null && attachment.uploaderId === user.id
}
