export const useTargetQuery = (id: MaybeRefOrGetter<number>, callback?: (data: TTask) => void) => {
  const $fetch = useRequestFetch()
  return useQuerySSR({
    enabled: computed(() => toValue(id) > 0),
    queryKey: keys.target(id),
    queryFn: () => {
      return $fetch<TTask>(`/api/targets/${toValue(id)}`).then(data => {
        callback?.(data)
        return data
      })
    }
  })
}
