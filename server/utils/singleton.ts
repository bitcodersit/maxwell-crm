export const createSingleton = <T>(name: string, factory: () => T) => {
  const global = globalThis as unknown as {
    [key: string]: T | undefined
  }
  const instance = global[name] ?? factory()
  if (process.env.NODE_ENV !== 'production') global[name] = instance
  return instance
}
