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
}
