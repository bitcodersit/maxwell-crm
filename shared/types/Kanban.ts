export type TBoardModule = 'LEADS' | 'TASKS'
export type TBoardModuleParam = 'leads' | 'tasks'

export type TBoard = {
  id: number
  module: TBoardModule
  name: string
  slug: string
}

export type TBoardColumn = {
  id: number
  boardId: number
  name: string
  color: string | null
  sortOrder: string
  pinned: boolean
}

export type TBoardItem = {
  id: number
  boardId: number
  columnId: number
  sortOrder: string
  leadId: number | null
  taskId: number | null
}

export type TBoardDetail = TBoard & {
  columns: (TBoardColumn & { itemCount?: number })[]
  items: TBoardItem[]
}
