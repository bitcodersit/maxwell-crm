export const assignLeadToTheBoard = async (leadId: number) => {
  const board = await findBoardToAssign(BoardModule.LEADS)
  if (board && board.columns.at(-1)?.id) {
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
        columnId: board.columns.at(-1)!.id,
        sortOrder: getSortOrder(board.columns.at(-1)?.items.at(-1)?.sortOrder)
      },
      update: {}
    })
  }
}
