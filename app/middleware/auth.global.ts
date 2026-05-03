const unauthenticatedRoutes = ['/login', '/forgot-password', '/reset-password']

export default defineNuxtRouteMiddleware((to, from) => {
  const { user } = useUserSession()

  if (unauthenticatedRoutes.includes(to.path) && user.value) {
    return navigateTo('/')
  }

  if (!unauthenticatedRoutes.includes(to.path) && !user.value) {
    return navigateTo('/login')
  }
})
