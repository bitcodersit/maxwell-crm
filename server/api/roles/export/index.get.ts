import { getRoles } from '../index.get'
import { exportData } from '~~/server/utils/export'

export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event)
  if (!can(user, ['export-any-roles'])) {
    throw err.denied()
  }

  const query = getQuery(event)
  const selection = query.selection?.toString() ?? ''
  if (['all', 'selected'].includes(selection) || query.id) {
    query.paginate = false
  }

  const { error, data } = await getRoles(event, query)
  if (error) throw error

  const rows = Array.isArray(data) ? data : data.data
  return exportData<TRole>(event, rows, {
    format: query.format,
    filename: `Roles ${new Date().toISOString().slice(0, 10)} - ${Date.now()}`,
    columns: {
      id: true,
      name: true,
      description: true,
      createdAt: true,
      updatedAt: true,
      permissions: (v) =>
        v.rolePermissions?.map((rp) => rp.permission?.name).filter(Boolean).join(',') ?? '',
    },
  })
})
