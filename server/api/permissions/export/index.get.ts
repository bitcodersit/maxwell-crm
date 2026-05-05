import { getPermissions } from '../index.get'
import { exportData } from '~~/server/utils/export'

export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event)
  if (!can(user, ['export-any-permissions'])) {
    throw err.denied()
  }

  const query = getQuery(event)
  const selection = query.selection?.toString() ?? ''
  if (['all', 'selected'].includes(selection) || query.id) {
    query.paginate = false
  }

  const { error, data } = await getPermissions(event, query)
  if (error) throw error

  const rows = Array.isArray(data) ? data : data.data
  return exportData<TPermission>(event, rows, {
    format: query.format,
    filename: `Permissions ${new Date().toISOString().slice(0, 10)} - ${Date.now()}`,
    columns: {
      id: true,
      name: true,
      description: true,
      createdAt: true,
      updatedAt: true,
      roles: (v) => v.rolePermissions?.map((rp) => rp.role?.name).join(',') ?? '',
    },
  })
})
