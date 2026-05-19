import type { Board, BoardColumn, BoardItem, BoardModule } from '~~/prisma/client/client'

export type TBoardItem = BoardItem & {
  lead: TMaybe<TLead>
  task: TMaybe<TTask>
}

export type TBoardColumn = BoardColumn & {
  board: TMaybe<TBoard>
  _count: TMaybe<{
    items: TMaybe<number>
  }>
}

export type TBoard = Board & {
  items: TBoardItem[]
  columns: TBoardColumn[]
}

export type TBoardModule = BoardModule
