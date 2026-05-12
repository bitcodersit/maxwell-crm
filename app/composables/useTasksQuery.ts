export const useTasksQuery = (query?: MaybeRefOrGetter<Record<string, any>>) => {
  const $fetch = useRequestFetch()
  return useQuerySSR({
    queryKey: keys.tasks(query),
    queryFn() {
      return $fetch<TPaginated<TTask>>(`/api/tasks`, {
        query: toValue(query)
      })
    },
    initialData() {
      return toPaginated<TTask>()
    }
  })
}
