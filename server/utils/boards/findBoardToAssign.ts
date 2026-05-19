export const findBoardToAssign = (module: TBoardModule) => {
  return prisma.board.findFirst({
    where: {
      module,
      isDefault: true
    },
    select: {
      id: true,
      columns: {
        take: 1,
        where: {
          isDefault: true
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
