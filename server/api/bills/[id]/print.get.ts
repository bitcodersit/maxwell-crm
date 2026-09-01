export default defineEventHandler(async event => {
  const user = await getCurrentUser(event)
  if (!canReadBills(user)) {
    throw err.denied()
  }

  const id = getRouterParamId(event)
  const query = getQuery(event)

  const bill = await getBill(event, {
    input: {
      id
    }
  })

  const bytes = await createBillInvoicePdf(bill as TBill)
  const filename = `conveyance-bill-${id}.pdf`

  setHeader(event, 'Content-Type', 'application/pdf')
  setHeader(
    event,
    'Content-Disposition',
    isTrue(query.download) ? `attachment; filename="${filename}"` : `inline; filename="${filename}"`
  )

  return Buffer.from(bytes)
})
