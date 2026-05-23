import type { H3Event } from 'h3'

export const getRouterParamId = (event: H3Event, name = 'id', options?: { validate?: boolean }) => {
  const validate = options?.validate ?? true
  const id = Number(getRouterParam(event, name))
  if (validate) {
    if (isNaN(id) || !Number.isInteger(id) || id < 1) {
      throw err.notFound()
    }
    return id
  }
  return !isNaN(id) ? id : undefined
}

export const getRouterParamIds = (event: H3Event, name = 'id') => {
  const id = getRouterParam(event, name)
  const ids = (id || '')
    .split(',')
    .map(Number)
    .filter(n => !Number.isNaN(n))
  if (!ids.length) throw err.notFound()
  return ids
}
