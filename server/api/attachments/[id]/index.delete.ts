import type { H3Event } from 'h3'
import { getCurrentUser } from '~~/server/api/me/index.get'

export const deleteAttachmentById = async (event: H3Event, id: number) => {
  const user = await getCurrentUser(event, false)

  const canDeleteAny = can(user, ['delete-any-attachments'])
  const canDeleteOwn = can(user, ['delete-own-attachments'])

  if (!canDeleteAny && !canDeleteOwn) {
    throw err.denied()
  }

  const attachment = await prisma.attachment.findUnique({
    where: { id },
    include: !canDeleteAny
      ? {
          users: {
            where: { id: user.id },
            select: { id: true },
          },
        }
      : undefined,
  })

  if (!attachment) throw err.notFound()
  if (!canDeleteAny && !(attachment as any).users?.length) {
    throw err.denied()
  }

  const storage = getStorage(event, attachment.provider)
  await storage.delete(attachment.path)

  return prisma.attachment.delete({
    where: {
      id,
    },
  })
}

export default defineEventHandler((event) => {
  const id = Number(getRouterParam(event, 'id'))
  if (!Number.isInteger(id) || id < 1) {
    throw err.notFound()
  }
  return deleteAttachmentById(event, id)
})
