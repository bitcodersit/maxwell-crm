export const useTargetDeleteMutation = (id: MaybeRefOrGetter<number>) => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => {
      return $fetch(`/api/targets/${toValue(id)}`, {
        method: 'DELETE'
      })
    },
    onSuccess() {
      queryClient.invalidateQueries({
        queryKey: keys.targets()
      })
      queryClient.invalidateQueries({
        queryKey: keys.targetsOverview()
      })
      queryClient.invalidateQueries({
        queryKey: keys.targetsLeaderboard()
      })
      queryClient.removeQueries({
        queryKey: keys.target(id)
      })
    }
  })
}
