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
      message: 'Unprocessable Entity',
      data: z.treeifyError(error),
    })
  },
  denied() {
    return createError({
      statusCode: 403,
      message: 'Permission denied',
      data: {
        message: 'You are not authorized to access this resource',
      },
    })
  },
}
