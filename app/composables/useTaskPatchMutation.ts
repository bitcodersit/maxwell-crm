export const useTaskPatchMutation = (id: MaybeRefOrGetter<number>) => {
  const toast = useToast()
  const queryClient = useQueryClient()
  const controller = ref<AbortController>()
  return useMutation({
    mutationFn: (body: Partial<TTask>) => {
      if (controller.value) {
        controller.value.abort()
      }
      controller.value = new AbortController()
      return $fetch<TTask>(`/api/tasks/${toValue(id)}`, {
        body,
        method: 'PATCH',
        signal: controller.value.signal
      })
    },
    onSuccess() {
      queryClient.invalidateQueries({
        queryKey: keys.tasks()
      })
    },
    onError(error) {
      const { message, errors } = parseError(error)
      queryClient.invalidateQueries({
        queryKey: keys.task(id)
      })
      toast.add({
        color: 'error',
        title: 'Error while saving changes',
        description: errors?.length ? errors.map(e => e.message).join(', ') : message
      })
    }
  })
}
