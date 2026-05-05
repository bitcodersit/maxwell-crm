import { getUsers } from '../index.get'
import { exportData } from '~~/server/utils/export'

type TUserExportRow = {
  userRoles?: {
    role?: {
      name?: string | null
    } | null
  }[]
}

export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event)
  if (!can(user, ['export-any-users'])) {
    throw err.denied()
  }

  const query = getQuery(event)
  const selection = query.selection?.toString() ?? ''
  if (['all', 'selected'].includes(selection) || query.id) {
    query.paginate = false
  }

  const { error, data } = await getUsers(event, query)
  if (error) throw error

  const rows = Array.isArray(data) ? data : data.data
  return exportData<TUserExportRow>(event, rows as TUserExportRow[], {
    format: query.format,
    filename: `Users ${new Date().toISOString().slice(0, 10)} - ${Date.now()}`,
    columns: {
      id: true,
      name: true,
      email: true,
      createdAt: true,
      updatedAt: true,
      roles: (v) => v.userRoles?.map((ur) => ur.role?.name).filter(Boolean).join(',') ?? '',
    },
  })
})
