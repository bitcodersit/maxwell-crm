export const useTaskQuery = (id: MaybeRefOrGetter<number>, callback?: (data: TTask) => void) => {
  const $fetch = useRequestFetch()
  return useQuerySSR({
    enabled: computed(() => toValue(id) > 0),
    queryKey: keys.task(id),
    queryFn: () => {
      return $fetch<TTask>(`/api/tasks/${toValue(id)}`).then(data => {
        callback?.(data)
        return data
      })
    }
  })
}
