export const useTaskPatchMutation = (id: MaybeRefOrGetter<number>) => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (body: Partial<TTask>) => {
      queryClient.setQueryData(keys.task(id), (old: TTask) => {
        return { ...old, ...body }
      })
      return $fetch(`/api/tasks/${toValue(id)}`, {
        method: 'PATCH',
        body
      })
    },
    onSuccess() {
      queryClient.invalidateQueries({
        queryKey: keys.tasks()
      })
    }
  })
}
