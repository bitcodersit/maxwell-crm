const getMessage = (value: any) => {
  if (value.errors?.[0]) return value.errors[0]
  if ('properties' in value && Object.keys(value.properties).length) {
    return Object.values(value.properties)
      .map<any>((value: any) => getMessage(value))
      .filter(Boolean)
      .join(', ')
  }
  return ''
}

export const parseError = (
  error: any,
  defaultMessage = 'Something went wrong! Please try again.'
) => {
  const properties: any = error.data?.data?.properties || {}
  const entries = Object.entries(properties)
  const message = error.data?.message || error.message || defaultMessage
  if (!entries.length) {
    return {
      message,
      title: message,
      description: message
    }
  }
  const errors = entries.map(([name, value]: any) => ({
    name,
    message: getMessage(value)
  }))
  return {
    errors,
    message,
    title: message,
    description: errors.map(e => e.message).join(', ')
  }
}
