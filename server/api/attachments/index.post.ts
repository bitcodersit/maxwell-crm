import { randomUUID } from 'node:crypto'

const allowedFields = Object.keys(prisma.attachable.fields).filter(
  field => !['id', 'attachmentId', 'createdAt', 'updatedAt'].includes(field)
)

const zSchema = z
  .object({
    folder: z.string().nullish(),
    attachableId: z.number().nullish(),
    attachableField: z.custom<keyof typeof prisma.attachable.fields>(
      (v: any) => {
        if (!v) return true
        return allowedFields.includes(v)
      },
      {
        message: `Attachable field is invalid, allowed fields are: ${allowedFields.join(', ')}`
      }
    )
  })
  .superRefine((data, ctx) => {
    if (
      (data.attachableId && !data.attachableField) ||
      (!data.attachableId && data.attachableField)
    ) {
      ctx.addIssue({
        code: 'custom',
        message: 'Attachable id and field are required'
      })
    }
  })

export default defineEventHandler(async event => {
  const user = await getCurrentUser(event, {
    cache: false
  })

  if (!user.can?.createAnyAttachments || !user.can?.createOwnAttachments) {
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
      attachableId: Number(fd.get('attachableId')),
      attachableField: fd.get('attachableField')
    },
    zSchema
  )

  const results = []
  const storage = getStorage(event)

  for (const file of files) {
    if (file instanceof File) {
      const ext = file.name.split('.').pop()
      const path = [input.folder, input.attachableId, `${randomUUID()}.${ext}`]
        .filter(v => !!v)
        .join('/')
      const buf = Buffer.from(await file.arrayBuffer())
      await storage.put(path, buf)
      const attachment = await prisma.attachment.create({
        data: {
          path,
          name: file.name,
          mime: file.type,
          size: file.size,
          provider: storage.provider()
        }
      })
      if (input.attachableId && input.attachableField) {
        const attachable = await prisma.attachable.create({
          data: {
            attachmentId: attachment.id,
            [input.attachableField]: input.attachableId
          }
        })
        results.push({
          ...attachment,
          attachables: [attachable]
        })
      } else {
        results.push(attachment)
      }
    }
  }

  return results
})
