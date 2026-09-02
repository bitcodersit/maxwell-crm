export const useTargetPatchMutation = (id: MaybeRefOrGetter<number>) => {
  const toast = useToast()
  const queryClient = useQueryClient()
  const controller = ref<AbortController>()
  return useMutation({
    mutationFn: (body: Partial<TTask> & Record<string, any>) => {
      if (controller.value) {
        controller.value.abort()
      }
      controller.value = new AbortController()
      return $fetch<TTask>(`/api/targets/${toValue(id)}`, {
        body,
        method: 'PATCH',
        signal: controller.value.signal
      })
    },
    onSuccess(data) {
      queryClient.setQueryData(keys.target(id), (old: TTask) => {
        if (!old) return data
        return { ...old, ...data }
      })
      queryClient.invalidateQueries({
        queryKey: keys.targets()
      })
      queryClient.invalidateQueries({
        queryKey: keys.targetsOverview()
      })
      queryClient.invalidateQueries({
        queryKey: keys.targetsLeaderboard()
      })
      queryClient.invalidateQueries({
        queryKey: keys.targetHistory(id)
      })
    },
    onError(error) {
      const { message, errors } = parseError(error)
      queryClient.invalidateQueries({
        queryKey: keys.target(id)
      })
      toast.add({
        color: 'error',
        title: 'Error while saving changes',
        description: errors?.length ? errors.map(e => e.message).join(', ') : message
      })
    }
  })
}
