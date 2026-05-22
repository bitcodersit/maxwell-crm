import { randomUUID } from 'node:crypto'

const allowedAttachableModels = [
  'task',
  'lead',
  'followUp',
  'property',
  'visit',
  'comment'
] as const

const zSchema = z
  .object({
    folder: z.string().nullish(),
    attachableId: z.number().nullish(),
    attachableModelId: z.number().nullish(),
    attachableModelType: z.enum(allowedAttachableModels).nullish()
  })
  .superRefine((data, ctx) => {
    const hasDirectAttachableId = !!data.attachableId
    const hasModelRef = !!data.attachableModelId || !!data.attachableModelType
    const hasFullModelRef = !!data.attachableModelId && !!data.attachableModelType

    if (!hasDirectAttachableId && !hasModelRef) {
      ctx.addIssue({
        code: 'custom',
        message: 'Provide either attachableId or (attachableModelId + attachableModelType)'
      })
      return
    }

    if (!hasDirectAttachableId && hasModelRef && !hasFullModelRef) {
      ctx.addIssue({
        code: 'custom',
        message: 'Both attachableModelId and attachableModelType are required together'
      })
    }
  })

const parseOptionalNumber = (value: FormDataEntryValue | null) => {
  if (value == null || value === '') return null
  const n = Number(value)
  return Number.isFinite(n) ? n : NaN
}

export default defineEventHandler(async event => {
  const user = await getCurrentUser(event)

  if (!user.createAnyAttachments || !user.createOwnAttachments) {
    throw err.denied()
  }

  const fd = await readFormData(event)
  const files = fd.getAll('files')

  if (!files.length || files.some(file => !(file instanceof File))) {
    throw createError({
      statusCode: 422,
      message: 'There is no files to upload or some of the files are not valid'
    })
  }

  const input = await validate(
    {
      folder: fd.get('folder'),
      attachableId: parseOptionalNumber(fd.get('attachableId')),
      attachableModelId: parseOptionalNumber(fd.get('attachableModelId')),
      attachableModelType: fd.get('attachableModelType')
    },
    zSchema
  )

  const results = []
  const storage = getStorage(event)

  for (const file of files) {
    if (file instanceof File) {
      const ext = file.name.split('.').pop()
      const path = [
        input.folder,
        input.attachableModelId || input.attachableId,
        `${randomUUID()}.${ext}`
      ]
        .filter(v => !!v)
        .join('/')
      const buf = Buffer.from(await file.arrayBuffer())
      await storage.put(path, buf)

      let attachment = await prisma.attachment.create({
        data: {
          path,
          name: file.name,
          mime: file.type,
          size: file.size,
          provider: storage.provider()
        }
      })

      let targetAttachableId = input.attachableId ?? null

      if (!targetAttachableId && input.attachableModelId && input.attachableModelType) {
        const model = (prisma as any)[input.attachableModelType]
        const entity = await model.findUnique({
          where: { id: input.attachableModelId },
          select: { id: true, attachableId: true }
        })
        if (!entity) {
          throw createError({
            statusCode: 404,
            message: `${input.attachableModelType} not found with id ${input.attachableModelId}`
          })
        }

        targetAttachableId = entity.attachableId as number | null
        if (!targetAttachableId) {
          const created = await prisma.attachable.create({
            data: {}
          })
          await model.update({
            where: { id: entity.id },
            data: { attachableId: created.id }
          })
          targetAttachableId = created.id
        }
      }

      if (targetAttachableId) {
        attachment = await prisma.attachment.update({
          where: { id: attachment.id },
          data: {
            attachableId: targetAttachableId
          }
        })
      }

      results.push(attachment)
    }
  }

  return results
})
