export const getScopedBill: TScopeFn<Prisma.BillWhereInput> = (where, user) => {
  if (user.readAnyBills) return where
  return {
    AND: [
      where,
      {
        authorId: user.id
      }
    ]
  }
}
