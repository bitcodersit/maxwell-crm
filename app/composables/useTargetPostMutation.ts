export const useTargetPostMutation = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (body: Record<string, any>) => {
      return $fetch<TTask>(`/api/targets`, {
        body,
        method: 'POST'
      })
    },
    onSuccess() {
      queryClient.invalidateQueries({
        queryKey: keys.targets()
      })
      queryClient.invalidateQueries({
        queryKey: keys.targetsOverview()
      })
    }
  })
}
