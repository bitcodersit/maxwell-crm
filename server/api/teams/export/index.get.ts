import { getTeams } from '../index.get'
import { exportData } from '~~/server/utils/export'

type TTeamExportRow = {
  creator?: {
    name?: string | null
  } | null
  members?: {
    user?: {
      name?: string | null
    } | null
  }[]
}

export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event)
  if (!can(user, ['export-any-teams'])) {
    throw err.denied()
  }

  const query = getQuery(event)
  const selection = query.selection?.toString() ?? ''
  if (['all', 'selected'].includes(selection) || query.id) {
    query.paginate = false
  }

  const { error, data } = await getTeams(event, query)
  if (error) throw error

  const rows = Array.isArray(data) ? data : data.data
  return exportData<TTeamExportRow>(event, rows as TTeamExportRow[], {
    format: query.format,
    filename: `Teams ${new Date().toISOString().slice(0, 10)} - ${Date.now()}`,
    columns: {
      id: true,
      name: true,
      description: true,
      creator: (v) => v.creator?.name ?? '',
      members: (v) => v.members?.map((m) => m.user?.name).filter(Boolean).join(',') ?? '',
      createdAt: true,
      updatedAt: true,
    },
  })
})
