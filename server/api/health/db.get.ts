export default defineEventHandler(async (event) => {
  const startedAt = Date.now()

  try {
    await prisma.$queryRaw`SELECT 1`

    return {
      status: 'ok',
      database: 'connected',
      name: process.env.NUXT_DATABASE_NAME,
      host: process.env.NUXT_DATABASE_HOST,
      latencyMs: Date.now() - startedAt
    }
  } catch (error) {
    const err = error as { message?: string, code?: string, cause?: { code?: string, message?: string } }

    setResponseStatus(event, 503)

    return {
      status: 'error',
      database: 'disconnected',
      name: process.env.NUXT_DATABASE_NAME,
      host: process.env.NUXT_DATABASE_HOST,
      latencyMs: Date.now() - startedAt,
      code: err.code ?? err.cause?.code ?? null,
      message: err.cause?.message ?? err.message ?? 'Unknown database error'
    }
  }
})
