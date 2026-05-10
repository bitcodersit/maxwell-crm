export const useTaskQuery = (id: MaybeRefOrGetter<number>) => {
  const $fetch = useRequestFetch()
  const query = useQuery({
    queryKey: keys.task(id),
    queryFn: () => $fetch(`/api/tasks/${toValue(id)}`)
  })
  onServerPrefetch(async () => {
    await query.suspense()
  })
  return query
}
