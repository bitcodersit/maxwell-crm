export default defineEventHandler(async event => {
  await requireUserSession(event)

  const module = getBoardModuleFromParam(getRouterParam(event, 'module'))
  const slug = (getRouterParam(event, 'slug') || '').trim()

  if (!module || !slug) throw err.notFound()
  return getBoardBySlug(module, slug)
})
