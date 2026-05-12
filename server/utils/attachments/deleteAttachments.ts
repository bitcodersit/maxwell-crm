import type { H3Event } from 'h3'

export const deleteAttachments = async (event: H3Event, ids: number[]) => {
  const user = await getCurrentUser(event, { cache: false })

  const canDeleteAny = can(user, ['delete-any-attachments'])
  const canDeleteOwn = can(user, ['delete-own-attachments'])

  if (!canDeleteAny && !canDeleteOwn) throw err.denied()
  const where = { id: { in: ids } }

  const attachments = await prisma.attachment.findMany({
    where,
    include: !canDeleteAny
      ? {
          users: {
            where: { id: user.id },
            select: { id: true }
          }
        }
      : undefined
  })

  if (!attachments.length) throw err.notFound()
  if (!canDeleteAny) {
    // if (!canDeleteAny && !(attachment as any).users?.length) {
    throw err.denied()
  }

  for (const attachment of attachments) {
    const storage = getStorage(event, attachment.provider)
    await storage.delete(attachment.path)
  }

  const data = await prisma.attachment.updateMany({
    where,
    data: {
      deletedAt: new Date()
    }
  })
  return {
    message: 'Attachments deleted successfully',
    data
  }
}
