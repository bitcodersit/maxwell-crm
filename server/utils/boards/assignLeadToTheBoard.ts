export const assignLeadToTheBoard = async (leadId: number, columnId?: number) => {
  const board = await findBoardToAssign(BoardModule.LEADS, columnId)
  const column = board?.columns[0]
  if (board && column?.id) {
    return prisma.boardItem.upsert({
      where: {
        boardId_leadId: {
          leadId,
          boardId: board.id
        }
      },
      create: {
        leadId,
        boardId: board.id,
        columnId: column.id,
        sortOrder: getSortOrder(column.items.at(-1)?.sortOrder)
      },
      update: {}
    })
  }
}
