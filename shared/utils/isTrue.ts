export const isTrue = (value: any) => {
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase()
    return ['true', '1', 'yes', 'y', 'on', 'enabled', 'enable'].includes(normalized)
  }
  return [1, true].includes(value)
}
