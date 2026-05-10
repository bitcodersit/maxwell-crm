export const useTasksQuery = (query?: MaybeRefOrGetter<Record<string, any>>) => {
  const $fetch = useRequestFetch()
  const result = useQuery({
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
  onServerPrefetch(async () => {
    await result.suspense()
  })
  return result
}
