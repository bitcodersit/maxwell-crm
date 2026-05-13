export const useTasksOverviewQuery = () => {
  const $fetch = useRequestFetch()
  const enabled = ref(false)
  onMounted(() => {
    enabled.value = true
  })
  return useQuerySSR({
    enabled,
    queryKey: keys.tasksOverview(),
    queryFn: () => {
      return $fetch('/api/tasks/overview')
    }
  })
}
