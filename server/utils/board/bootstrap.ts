import { BoardModule } from '~~/prisma/client/enums'
import { getAllLeads } from '~~/server/utils/demo/demoStore'
import { computeSortOrder, computeSortOrderBatch } from './sortOrder'

const LEAD_STATUS_COLUMNS = [
  { name: 'Hot', color: '#f87171' },
  { name: 'Warm', color: '#f59e0b' },
  { name: 'Cold', color: '#38bdf8' },
  { name: 'Not Interested', color: '#94a3b8' },
  { name: 'Closed', color: '#10b981' }
]

export const bootstrapDefaultLeadsBoard = async () => {
  const existing = await prisma.board.findFirst({
    where: {
      module: BoardModule.LEADS,
      slug: 'default',
      deletedAt: null
    },
    select: { id: true }
  })
  if (existing) return existing.id

  const leadRows = await getAllLeads()
  const columnKeys = computeSortOrderBatch(LEAD_STATUS_COLUMNS.length)

  const board = await prisma.board.create({
    data: {
      module: BoardModule.LEADS,
      slug: 'default',
      name: 'Leads',
      columns: {
        create: LEAD_STATUS_COLUMNS.map((column, index) => ({
          ...column,
          sortOrder:
            columnKeys.at(index) ?? computeSortOrder(columnKeys.at(index - 1) ?? null, null),
          pinned: false
        }))
      }
    }
  })

  const columns = await prisma.boardColumn.findMany({
    where: {
      boardId: board.id,
      deletedAt: null
    },
    orderBy: { sortOrder: 'asc' },
    select: { id: true, name: true }
  })

  const columnByName = Object.fromEntries(columns.map(column => [column.name, column.id]))
  const rowsByStatus = leadRows.reduce<Record<string, number[]>>((acc, lead) => {
    const status = lead.status || 'Warm'
    if (!acc[status]) acc[status] = []
    acc[status].push(lead.id)
    return acc
  }, {})

  const createRows = Object.entries(rowsByStatus).flatMap(([status, leadIds]) => {
    const columnId = columnByName[status]
    if (!columnId || !leadIds.length) return []
    const keys = computeSortOrderBatch(leadIds.length)
    return leadIds.map((leadId, index) => ({
      boardId: board.id,
      columnId,
      sortOrder: keys.at(index) ?? computeSortOrder(keys.at(index - 1) ?? null, null),
      leadId,
      taskId: null
    }))
  })

  if (createRows.length) {
    await prisma.boardItem.createMany({
      data: createRows
    })
  }

  return board.id
}

export const bootstrapModuleBoards = async (module: BoardModule) => {
  if (module === BoardModule.LEADS) {
    await bootstrapDefaultLeadsBoard()
  }
}
