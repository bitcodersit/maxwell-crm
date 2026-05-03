export default function useLogout() {
  const toast = useToast()
  const { status, execute } = useFetch('/api/logout', {
    method: 'POST',
    watch: false,
    immediate: false,
    onResponse(event) {
      if (!event.response.ok) {
        const error: any = event.response._data
        return toast.add({
          color: 'error',
          title: error.statusMessage,
          description: error.message,
        })
      }
      location.href = '/login'
    },
  })

  const isLoggingOut = computed(() => {
    return status.value === 'pending'
  })

  const logout = () => {
    if (!confirm('Are you sure you want to logout?')) return
    execute()
  }

  return {
    logout,
    isLoggingOut,
  }
}
