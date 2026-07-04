export const useTaskDeleteMutation = (id: MaybeRefOrGetter<number>) => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => {
      return $fetch(`/api/tasks/${toValue(id)}`, {
        method: 'DELETE'
      })
    },
    onSuccess() {
      queryClient.invalidateQueries({
        queryKey: keys.tasks()
      })
      queryClient.removeQueries({
        queryKey: keys.task(id)
      })
    }
  })
}
