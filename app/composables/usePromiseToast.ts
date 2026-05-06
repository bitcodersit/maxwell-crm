export const usePromiseToast = () => {
  const toast = useToast()
  return <P>(
    executor: (v: { onSuccess: <T>(e: T) => T; onError: (e: unknown) => never }) => P,
    initial: Parameters<typeof toast.add>[0],
    success: (e: Awaited<P>) => { title: string; description?: string },
    error: (e: unknown) => { title: string; description?: string },
    id = `promise-toast-${Date.now()}-${Math.random().toString(36).slice(2)}`
  ) => {
    toast.add({
      ...initial,
      id,
      icon: 'i-lucide-loader-circle',
      color: 'primary',
      duration: 0,
      ui: { icon: 'animate-spin' },
    })
    executor({
      onSuccess<T>(e: T) {
        toast.add({
          id,
          icon: 'i-lucide-circle-check',
          color: 'success',
          duration: 3000,
          ui: { icon: '' },
          ...success(e as Awaited<P>),
        })
        return e
      },
      onError(e) {
        toast.add({
          id,
          icon: 'i-lucide-circle-x',
          color: 'error',
          duration: 5000,
          ui: { icon: '' },
          ...error(e),
        })
        throw e
      },
    })
  }
}
