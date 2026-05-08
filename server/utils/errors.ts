import type { ZodError } from 'zod'

export const err = {
  unauth(message = 'Please login to access this resource') {
    return createError({
      statusCode: 401,
      statusMessage: 'Unauthorized',
      message
    })
  },
  zod(error: ZodError) {
    return createError({
      statusCode: 422,
      statusMessage: 'Unprocessable Entity',
      data: z.treeifyError(error)
    })
  },
  denied(message = 'You are not authorized to access this resource') {
    return createError({
      statusCode: 403,
      statusMessage: 'Forbidden',
      message
    })
  },
  notFound(message = 'The requested resource was not found') {
    return createError({
      statusCode: 404,
      statusMessage: 'Not Found',
      message
    })
  },
  unprocessable(properties: Record<string, { errors: string[] }>) {
    return createError({
      statusCode: 422,
      data: {
        properties
      }
    })
  }
}
