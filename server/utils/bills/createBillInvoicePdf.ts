import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'

const formatDate = (value?: Date | string | null) => {
  if (!value) return '—'
  return new Date(value).toLocaleDateString('en-GB', {
    year: 'numeric',
    month: 'short',
    day: '2-digit'
  })
}

const formatMoney = (amount?: unknown) => {
  return new Intl.NumberFormat('en-BD', {
    style: 'currency',
    currency: 'BDT',
    maximumFractionDigits: 2
  }).format(Number(amount || 0))
}

const line = (
  page: import('pdf-lib').PDFPage,
  y: number,
  options: {
    label: string
    value: string
    labelX?: number
    valueX?: number
    size?: number
  }
) => {
  const labelX = options.labelX ?? 50
  const valueX = options.valueX ?? 200
  const size = options.size ?? 11
  page.drawText(options.label, {
    x: labelX,
    y,
    size,
    color: rgb(0.3, 0.3, 0.3)
  })
  page.drawText(options.value || '—', {
    x: valueX,
    y,
    size,
    color: rgb(0.1, 0.1, 0.1)
  })
}

export const createBillInvoicePdf = async (bill: TBill) => {
  const pdf = await PDFDocument.create()
  const page = pdf.addPage([595.28, 841.89]) // A4
  const helvetica = await pdf.embedFont(StandardFonts.Helvetica)
  const helveticaBold = await pdf.embedFont(StandardFonts.HelveticaBold)
  page.setFont(helvetica)

  page.drawText('Maxwell CRM', {
    x: 50,
    y: 790,
    size: 20,
    font: helveticaBold,
    color: rgb(0.15, 0.2, 0.45)
  })
  page.drawText('Conveyance Bill Invoice', {
    x: 50,
    y: 764,
    size: 13,
    font: helveticaBold,
    color: rgb(0.2, 0.2, 0.2)
  })

  page.drawRectangle({
    x: 380,
    y: 744,
    width: 165,
    height: 70,
    borderColor: rgb(0.85, 0.85, 0.85),
    borderWidth: 1
  })

  line(page, 792, {
    label: 'Invoice #',
    value: `CB-${bill.id}`,
    labelX: 392,
    valueX: 455,
    size: 10
  })
  line(page, 776, {
    label: 'Date',
    value: formatDate(bill.date),
    labelX: 392,
    valueX: 455,
    size: 10
  })
  line(page, 760, {
    label: 'Status',
    value: bill.status ? bill.status : '—',
    labelX: 392,
    valueX: 455,
    size: 10
  })

  page.drawLine({
    start: { x: 50, y: 730 },
    end: { x: 545, y: 730 },
    thickness: 1,
    color: rgb(0.85, 0.85, 0.85)
  })

  page.setFont(helveticaBold)
  page.drawText('Employee Details', {
    x: 50,
    y: 705,
    size: 12,
    color: rgb(0.2, 0.2, 0.2)
  })
  page.setFont(helvetica)

  line(page, 684, { label: 'Employee', value: bill.user?.name || '—' })
  line(page, 666, { label: 'Prepared by', value: bill.author?.name || '—' })
  line(page, 648, {
    label: 'Approved By',
    value:
      (bill.approvals || [])
        .map(approval => approval.user?.name)
        .filter(Boolean)
        .join(', ') || '—'
  })

  page.setFont(helveticaBold)
  page.drawText('Bill Details', {
    x: 50,
    y: 614,
    size: 12,
    color: rgb(0.2, 0.2, 0.2)
  })
  page.setFont(helvetica)

  line(page, 593, { label: 'Type', value: bill.type?.name || '—' })
  line(page, 575, { label: 'Bill date', value: formatDate(bill.date) })
  line(page, 557, { label: 'Amount', value: formatMoney(bill.amount) })

  page.drawRectangle({
    x: 50,
    y: 470,
    width: 495,
    height: 70,
    borderColor: rgb(0.85, 0.85, 0.85),
    borderWidth: 1
  })
  page.setFont(helveticaBold)
  page.drawText('Purpose / Notes', {
    x: 60,
    y: 522,
    size: 11,
    color: rgb(0.2, 0.2, 0.2)
  })
  page.setFont(helvetica)
  page.drawText((bill.purpose || '—').slice(0, 250), {
    x: 60,
    y: 500,
    size: 10,
    color: rgb(0.1, 0.1, 0.1),
    maxWidth: 475,
    lineHeight: 13
  })

  page.setFont(helveticaBold)
  page.drawRectangle({
    x: 360,
    y: 410,
    width: 185,
    height: 42,
    color: rgb(0.95, 0.97, 1)
  })
  page.drawText('Total Amount', {
    x: 370,
    y: 436,
    size: 10,
    color: rgb(0.3, 0.3, 0.3)
  })
  page.drawText(formatMoney(bill.amount), {
    x: 370,
    y: 417,
    size: 16,
    font: helveticaBold,
    color: rgb(0.12, 0.22, 0.52)
  })

  page.setFont(helvetica)
  page.drawText(`Generated at: ${formatDate(new Date())}`, {
    x: 50,
    y: 70,
    size: 9,
    color: rgb(0.45, 0.45, 0.45)
  })
  page.drawText('This is a system-generated invoice from Maxwell CRM.', {
    x: 50,
    y: 56,
    size: 9,
    color: rgb(0.45, 0.45, 0.45)
  })

  return await pdf.save()
}
