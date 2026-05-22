import { zExportable } from '~~/server/utils/zod'

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

const zExportTeams = zGetTeams.and(zExportable())

export default defineEventHandler(async event => {
  const user = await getCurrentUser(event)
  if (!user.exportAnyTeams) throw err.denied()

  const query = getQuery(event)
  const input = await validate(query, zExportTeams)

  if (['all', 'selected'].includes(input.selection)) {
    input.paginate = false
  }

  const data = await getTeams(event, { input })
  const rows = Array.isArray(data) ? data : data.data

  return exportData<TTeamExportRow>(event, rows as TTeamExportRow[], {
    format: query.format,
    filename: `Teams ${new Date().toISOString().slice(0, 10)} - ${Date.now()}`,
    columns: {
      id: true,
      name: true,
      description: true,
      creator: v => v.creator?.name ?? '',
      members: v =>
        v.members
          ?.map(m => m.user?.name)
          .filter(Boolean)
          .join(',') ?? '',
      createdAt: true,
      updatedAt: true
    }
  })
})
