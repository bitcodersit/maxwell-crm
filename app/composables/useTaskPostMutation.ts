export const useTaskPostMutation = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (body: TTask) => {
      return $fetch<TTask>(`/api/tasks`, {
        body,
        method: 'POST'
      })
    },
    onSuccess() {
      queryClient.invalidateQueries({
        queryKey: keys.tasks()
      })
    }
  })
}
