const unauthenticatedOnlyRoutes = ['/login', '/forgot-password', '/reset-password']
const publicRoutes = ['/verify-email']

export default defineNuxtRouteMiddleware(to => {
  const { user } = useUserSession()

  if (unauthenticatedOnlyRoutes.includes(to.path) && user.value) {
    return navigateTo('/')
  }

  if (
    !unauthenticatedOnlyRoutes.includes(to.path) &&
    !publicRoutes.includes(to.path) &&
    !user.value
  ) {
    return navigateTo('/login')
  }
})
