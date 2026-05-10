type TOptions<T extends { fetchedAt?: number }> = {
  api: MaybeRefOrGetter<string>
  lazy?: boolean
  query?: MaybeRefOrGetter<Record<string, any>>
  server?: boolean
  immediate?: boolean
  staleTime?: MaybeRefOrGetter<number>
  getDefault?: () => T
}

export const useFetchApi = <T extends { fetchedAt?: number }>({
  api,
  query,
  lazy = true,
  server = false,
  immediate = true,
  staleTime = 30 * 1000,
  getDefault
}: TOptions<T>) => {
  const count = ref(0)
  const key = computed(() => {
    return `${toValue(api)}:${count.value}:${JSON.stringify(toValue(query))}`
  })
  const res = useFetch(api, {
    key,
    lazy,
    query,
    server,
    immediate,
    default: getDefault,
    getCachedData(key) {
      const nuxtApp = useNuxtApp()
      const data = nuxtApp.payload.data[key] || nuxtApp.static.data[key]
      // console.log('getCachedData', data, key)
      // if (!data || Date.now() - data.fetchedAt > toValue(staleTime)) return
      return data
    },
    transform(data: T) {
      data.fetchedAt = Date.now()
      return data
    }
  })
  return {
    ...res,
    refetch() {
      count.value++
    }
  }
}
