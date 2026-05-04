type TOptions<T> = {
  query?: MaybeRefOrGetter<Record<string, any>>
  endpoint: MaybeRefOrGetter<string>
  staleTime?: MaybeRefOrGetter<number>
  immediate?: boolean
  refreshKey?: MaybeRefOrGetter<number>
  getDefault?: () => T
}

export const useFetchApi = <T extends TPaginated<any>>({
  query,
  endpoint,
  staleTime = 30 * 1000,
  immediate = true,
  refreshKey = 0,
  getDefault,
}: TOptions<T>) => {
  const key = computed(() => {
    return `${toValue(endpoint)}:${toValue(refreshKey)}:${JSON.stringify(toValue(query))}`
  })
  return useFetch(endpoint, {
    key,
    query,
    immediate,
    lazy: true,
    server: false,
    default: getDefault,
    getCachedData(key) {
      const nuxtApp = useNuxtApp()
      const data = nuxtApp.payload.data[key]
      if (!data || Date.now() - data.fetchedAt > toValue(staleTime)) return
      return data
    },
    transform(data: T) {
      return {
        ...data,
        fetchedAt: Date.now(),
      }
    },
  })
}
