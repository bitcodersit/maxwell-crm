export const getBoard = async (id?: string) => {
  const where: Prisma.BoardWhereInput = {
    deletedAt: null
  }

  const numberId = Number(id)
  if (!isNaN(numberId)) where.id = numberId
  else if (typeof id === 'string') where.name = id

  const board = await prisma.board.findFirst({
    where,
    include: {
      columns: true
    }
  })

  if (!board) {
    return {
      data: null,
      error: err.notFound()
    }
  }

  return {
    data: board,
    error: null
  }
}
