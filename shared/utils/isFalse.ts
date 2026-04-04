export const isFalse = (value: any) => {
  return ['false', '0', 0, false].includes(value)
}
