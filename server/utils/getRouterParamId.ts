import type { H3Event } from 'h3'

export const getRouterParamId = (event: H3Event, name = 'id') => {
  const id = Number(getRouterParam(event, name))
  if (isNaN(id) || !Number.isInteger(id) || id < 1) {
    throw err.notFound()
  }
  return id
}
