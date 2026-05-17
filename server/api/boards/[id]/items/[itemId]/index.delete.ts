export default defineEventHandler(async event => {
  await requireUserSession(event)

  const boardId = Number(getRouterParam(event, 'boardId'))
  const itemId = Number(getRouterParam(event, 'itemId'))
  if (!Number.isInteger(boardId) || boardId < 1) throw err.notFound()
  if (!Number.isInteger(itemId) || itemId < 1) throw err.notFound()

  return deleteBoardItem(boardId, itemId)
})
