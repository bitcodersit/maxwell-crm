export const getConnect = (id?: TMaybe<number>) => {
  if (!id) return undefined
  return {
    connect: {
      id
    }
  }
}
