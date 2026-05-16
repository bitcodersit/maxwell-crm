export const useTasksQuery = (query?: MaybeRefOrGetter<Record<string, any>>) => {
  const $fetch = useRequestFetch()
  return useInfiniteQuerySSR<TPaginated<TTask>>({
    initialPageParam: 1,
    queryKey: keys.tasks(query),
    queryFn({ pageParam }) {
      return $fetch<TPaginated<TTask>>(`/api/tasks`, {
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
