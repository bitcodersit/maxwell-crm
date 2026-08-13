export const useTargetsQuery = (query?: MaybeRefOrGetter<Record<string, any>>) => {
  const $fetch = useRequestFetch()
  return useInfiniteQuerySSR<TPaginated<TTask>>({
    initialPageParam: 1,
    queryKey: keys.targets(query),
    queryFn({ pageParam }) {
      return $fetch<TPaginated<TTask>>(`/api/targets`, {
        query: {
          ...toValue(query),
          page: pageParam
        }
      })
    },
    getPreviousPageParam(page) {
      return page.previousPage
    },
    getNextPageParam(page) {
      return page.nextPage
    },
    initialData() {
      return {
        pageParams: [],
        pages: []
      }
    }
  })
}
