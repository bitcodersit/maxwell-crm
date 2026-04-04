import { ZodError } from 'zod'

export const err = {
  unauth() {
    return createError({
      statusCode: 401,
      message: 'Unauthorized',
    })
  },
  zod(error: ZodError) {
    return createError({
      statusCode: 422,
      data: z.treeifyError(error),
    })
  },
  denied() {
    return createError({
      statusCode: 403,
      message: 'You are not authorized to access this resource',
    })
  },
  notFound() {
    return createError({
      statusCode: 404,
      message: 'The requested resource was not found',
    })
  },
  unprocessable(properties: Record<string, { errors: string[] }>) {
    return createError({
      statusCode: 422,
      data: {
        properties,
      },
    })
  },
}
