export const findBoardToAssign = (module: TBoardModule, columnId?: number) => {
  return prisma.board.findFirst({
    where: {
      module,
      isDefault: true,
      deletedAt: null
    },
    select: {
      id: true,
      columns: {
        take: 1,
        where: columnId
          ? {
              id: columnId,
              deletedAt: null
            }
          : {
              isDefault: true,
              deletedAt: null
            },
        select: {
          id: true,
          items: {
            take: 1,
            orderBy: {
              sortOrder: 'desc'
            },
            select: {
              id: true,
              sortOrder: true
            }
          }
        }
      }
    }
  })
}
