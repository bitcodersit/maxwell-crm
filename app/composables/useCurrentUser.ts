const _useCurrentUser = () => {
  const { user: sessionUser } = useUserSession()

  const { data: user, refetch } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => $fetch<TUser>('/api/me'),
    initialData: () => sessionUser.value as TUser,
    enabled: !!sessionUser
  })

  return {
    user,
    refetch
  }
}

export const useCurrentUser = createSharedComposable(_useCurrentUser)
