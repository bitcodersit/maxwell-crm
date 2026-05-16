export default defineEventHandler(async event => {
  await requireUserSession(event)

  const query = getQuery(event)
  const module = getBoardModuleFromParam(query.module)
  if (!module) {
    throw err.unprocessable({
      module: {
        errors: ['module must be one of: leads, tasks']
      }
    })
  }

  const data = await listBoards(module)
  return { data }
})
