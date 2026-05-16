export default defineEventHandler(async event => {
  await requireUserSession(event)

  const boardId = Number(getRouterParam(event, 'boardId'))
  if (!Number.isInteger(boardId) || boardId < 1) throw err.notFound()

  return getBoardById(boardId)
})
