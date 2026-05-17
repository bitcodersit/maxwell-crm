import type { Board, BoardColumn, BoardItem } from '~~/prisma/client/client'

export type TBoardItem = BoardItem & {
  lead: TMaybe<TLead>
  task: TMaybe<TTask>
}

export type TBoardColumn = BoardColumn & {
  board: TMaybe<TBoard>
}

export type TBoard = Board & {
  items: TBoardItem[]
  columns: TBoardColumn[]
}
