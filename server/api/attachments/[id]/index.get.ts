export default defineEventHandler(async (event) => {
  try {
    const id = Number(getRouterParam(event, 'id'))
    if (!Number.isInteger(id) || id < 1) {
      throw err.notFound()
    }

    const row = await prisma.attachment.findFirst({
      where: {
        id,
        deletedAt: null
      },
      select: {
        path: true,
        mime: true
      }
    })

    if (!row) throw err.notFound()

    const storage = getStorage(event)
    const buffer = await storage.get(row.path)

    if (row.mime) {
      setHeader(event, 'Content-Type', row.mime)
    }

    setHeader(event, 'Cache-Control', 'public, max-age=31536000, immutable')

    return buffer
  } catch {
    return err.notFound()
  }
})
