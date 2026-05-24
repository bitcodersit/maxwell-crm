export default defineEventHandler(() => {
  return toPaginated(
    BillStatuses.map(status => ({
      id: status,
      name: BillStatusLabel[status]
    }))
  )
})
