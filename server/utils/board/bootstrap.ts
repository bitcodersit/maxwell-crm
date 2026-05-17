import { computeSortOrder, computeSortOrderBatch } from './sortOrder'
import { TaskStatus } from '~~/prisma/client/enums'
import { getAllLeads } from '~~/server/utils/demo/demoStore'

const LEAD_STATUS_COLUMNS = [
  { name: 'Hot', color: '#f87171' },
  { name: 'Warm', color: '#f59e0b' },
  { name: 'Cold', color: '#38bdf8' },
  { name: 'Not Interested', color: '#94a3b8' },
  { name: 'Closed', color: '#10b981' }
]

const TASK_STATUS_COLUMNS = [
  { name: TaskStatus.TODO, color: '#94a3b8' },
  { name: TaskStatus.IN_PROGRESS, color: '#38bdf8' },
  { name: TaskStatus.IN_REVIEW, color: '#f59e0b' },
  { name: TaskStatus.COMPLETED, color: '#10b981' },
  { name: TaskStatus.FAILED, color: '#ef4444' },
  { name: TaskStatus.CANCELLED, color: '#64748b' }
]

export const bootstrapDefaultLeadsBoard = async () => {
  const existing = await prisma.board.findFirst({
    where: {
      // module: BoardModule.LEADS,
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
      // module: BoardModule.LEADS,
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

const backfillTasksBoardItems = async (boardId: number) => {
  const [columns, tasks] = await Promise.all([
    prisma.boardColumn.findMany({
      where: {
        boardId,
        deletedAt: null
      },
      select: { id: true, name: true }
    }),
    prisma.task.findMany({
      where: {
        deletedAt: null
      },
      orderBy: {
        id: 'asc'
      },
      select: {
        id: true,
        status: true
      }
    })
  ])

  const columnByName = Object.fromEntries(columns.map(column => [column.name, column.id]))
  const rowsByStatus = tasks.reduce<Record<string, number[]>>((acc, task) => {
    const status = task.status || TaskStatus.TODO
    if (!acc[status]) acc[status] = []
    acc[status].push(task.id)
    return acc
  }, {})

  const createRows = Object.entries(rowsByStatus).flatMap(([status, taskIds]) => {
    const columnId = columnByName[status]
    if (!columnId || !taskIds.length) return []
    const keys = computeSortOrderBatch(taskIds.length)
    return taskIds.map((taskId, index) => ({
      boardId,
      columnId,
      sortOrder: keys.at(index) ?? computeSortOrder(keys.at(index - 1) ?? null, null),
      leadId: null,
      taskId
    }))
  })

  if (createRows.length) {
    await prisma.boardItem.createMany({
      data: createRows,
      skipDuplicates: true
    })
  }
}

export const bootstrapDefaultTasksBoard = async () => {
  const existing = await prisma.board.findFirst({
    where: {
      // module: BoardModule.TASKS,
      slug: 'default',
      deletedAt: null
    },
    select: { id: true }
  })

  if (existing) {
    await backfillTasksBoardItems(existing.id)
    return existing.id
  }

  const columnKeys = computeSortOrderBatch(TASK_STATUS_COLUMNS.length)
  const board = await prisma.board.create({
    data: {
      // module: BoardModule.TASKS,
      slug: 'default',
      name: 'Tasks',
      columns: {
        create: TASK_STATUS_COLUMNS.map((column, index) => ({
          ...column,
          sortOrder:
            columnKeys.at(index) ?? computeSortOrder(columnKeys.at(index - 1) ?? null, null),
          pinned: false
        }))
      }
    }
  })

  await backfillTasksBoardItems(board.id)
  return board.id
}

export const bootstrapModuleBoards = async (module: string) => {
  if (module === 'leads') {
    await bootstrapDefaultLeadsBoard()
    return
  }
  if (module === 'tasks') {
    await bootstrapDefaultTasksBoard()
  }
}
