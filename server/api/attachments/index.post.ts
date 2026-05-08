import { randomUUID } from 'node:crypto'
import { StorageProvider } from '@@/prisma/client/client'

const ALLOWED_MIME = new Set(['image/jpeg', 'image/png', 'image/gif'])
const MAX_BYTES = 1024 * 1024

export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event)
  const userId = session.user.id

  const form = await readMultipartFormData(event)
  const file = form?.find(p => p.name === 'file' && p.filename)
  if (!file?.data?.length || !file.filename) {
    throw createError({
      statusCode: 422,
      message: 'File is required'
    })
  }

  const mime = file.type || 'application/octet-stream'
  if (!ALLOWED_MIME.has(mime)) {
    throw createError({
      statusCode: 422,
      message: 'Unsupported file type'
    })
  }
  if (file.data.length > MAX_BYTES) {
    throw createError({
      statusCode: 422,
      message: 'File too large'
    })
  }

  const ext = mime === 'image/jpeg' ? 'jpg' : mime === 'image/png' ? 'png' : 'gif'
  const key = `avatars/${userId}/${randomUUID()}.${ext}`

  const storage = getStorage(event)
  const buf = Buffer.isBuffer(file.data) ? file.data : Buffer.from(file.data)
  await storage.put(key, buf, { mime })

  const attachment = await prisma.attachment.create({
    data: {
      provider: StorageProvider.FILESYSTEM,
      path: key,
      name: file.filename,
      mime,
      size: buf.length
    }
  })

  return attachment
})
