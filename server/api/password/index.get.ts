export default defineEventHandler(async event => {
  const { password } = getQuery(event)

  if (!password) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Password is required'
    })
  }

  if (typeof password !== 'string') {
    throw createError({
      statusCode: 400,
      statusMessage: 'Password must be a string'
    })
  }

  return {
    password: await hashPassword(password)
  }
})
