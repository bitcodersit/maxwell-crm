export const isFalse = (value: any) => {
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase()
    return ['false', '0', 'no', 'n', 'off', 'disabled', 'disable'].includes(normalized)
  }
  return [0, false].includes(value)
}
