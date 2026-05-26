export const getConnect = <T extends TMaybe<number>>(
  id?: T
): T extends number
  ? {
      connect: {
        id: T
      }
    }
  : undefined => {
  return (
    id
      ? {
          connect: {
            id
          }
        }
      : undefined
  ) as any
}
