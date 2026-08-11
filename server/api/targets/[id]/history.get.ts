export default defineEventHandler(async event => {
  const id = Number(getRouterParam(event, 'id'))
  if (!Number.isInteger(id) || id < 1) {
    throw err.notFound()
  }

  return getTargetHistory(event, id)
})
