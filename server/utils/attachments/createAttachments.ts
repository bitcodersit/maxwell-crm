import type { H3Event } from 'h3'
import { randomUUID } from 'node:crypto'
import { z } from 'zod'
import { getAttachableId, zGetAttachable } from './getAttachableId'

export type TZCreateAttachmentsBase = z.infer<typeof zCreateAttachmentsBase>
export const zCreateAttachmentsBase = z.object({
  folder: z.string().nullish(),
  files: z.array(z.instanceof(File)).min(1)
})

export type TZCreateAttachments = z.infer<typeof zCreateAttachments>
export const zCreateAttachments = zCreateAttachmentsBase.and(zGetAttachable)

export const createAttachments = async (
  event: H3Event,
  options?: { input?: TZCreateAttachments }
) => {
  const user = await getCurrentUser(event)
  if (!user.createAnyAttachments || !user.createOwnAttachments) {
    throw err.denied()
  }

  const input = await getInput(event, zCreateAttachments, options)
  const attachableId = await getAttachableId(event, { input })

  const storage = getStorage(event)

  return await Promise.all(
    input.files.map(async file => {
      const ext = file.name.split('.').pop()
      const path = [
        input.folder,
        'attachableModelId' in input ? input.attachableModelId : input.attachableId,
        `${randomUUID()}.${ext}`
      ]
        .filter(v => !!v)
        .join('/')

      await storage.put(path, Buffer.from(await file.arrayBuffer()))

      return await prisma.attachment.create({
        data: {
          path,
          name: file.name,
          mime: file.type,
          size: file.size,
          uploaderId: user.id,
          attachableId,
          provider: storage.provider()
        }
      })
    })
  )
}
