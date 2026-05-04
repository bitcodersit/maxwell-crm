export const parseError = (
  error: any,
  defaultMessage = 'Something went wrong! Please try again.'
) => {
  const properties: any = error.data?.data?.properties || {}
  const entries = Object.entries(properties)
  const message = error.data?.message || error.message || defaultMessage
  if (!entries.length) return { message }
  return {
    message,
    errors: Object.entries(properties).map(([name, value]: any) => {
      return {
        name,
        message: value?.errors?.[0],
      }
    }),
  }
}
