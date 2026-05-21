export const jsonParse = <T = any, F = any>(value: string, fallback?: F) => {
  try {
    const parsed = JSON.parse(value)
    return [parsed, false] as [T, false]
  } catch {
    return [fallback, true] as [F, true]
  }
}
