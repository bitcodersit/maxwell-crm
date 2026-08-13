import type { H3Event } from 'h3'
import { endOfDay, startOfDay } from 'date-fns'
import { OptionType } from '~~/prisma/client/enums'
import { upsertBill, zCreateBill, type TZCreateBill } from './upsertBill'

export type TBillImportFailedRow = {
  row: number
  userId?: string
  email?: string
  type?: string
  date?: string
  amount?: string
  purpose?: string
  errors: string[]
}

export type TBillImportResult = {
  imported: number
  failed: TBillImportFailedRow[]
  total: number
}

const FIELDS = ['userId', 'email', 'type', 'date', 'amount', 'purpose'] as const

const HEADER_ALIASES: Record<string, string> = {
  userid: 'userId',
  'user id': 'userId',
  user_id: 'userId',
  employeeid: 'userId',
  'employee id': 'userId',
  employee_id: 'userId',
  id: 'userId',
  email: 'email',
  useremail: 'email',
  'user email': 'email',
  user_email: 'email',
  employeeemail: 'email',
  'employee email': 'email',
  employee_email: 'email',
  type: 'type',
  typeid: 'type',
  'type id': 'type',
  type_id: 'type',
  billtype: 'type',
  'bill type': 'type',
  bill_type: 'type',
  date: 'date',
  billdate: 'date',
  'bill date': 'date',
  bill_date: 'date',
  amount: 'amount',
  purpose: 'purpose'
}

const EXAMPLE_ROWS = [
  {
    userId: '2',
    email: '',
    type: 'Conveyance',
    date: '2026-08-01',
    amount: '250.00',
    purpose: 'Client visit to Gulshan'
  },
  {
    userId: '',
    email: 'employee@example.com',
    type: 'Advance',
    date: '2026-08-02',
    amount: '500',
    purpose: 'Travel advance'
  }
]

const resolveEmployeeId = async (
  raw: Record<string, string>,
  options: { currentUserId: number; canAssignAny: boolean }
): Promise<{ userId?: number; error?: string }> => {
  const userIdRaw = raw.userId?.trim()
  const emailRaw = raw.email?.trim()

  if (!options.canAssignAny) {
    if (userIdRaw && Number(userIdRaw) !== options.currentUserId) {
      return { error: 'You can only import bills for yourself' }
    }
    if (emailRaw) {
      const self = await prisma.user.findFirst({
        where: { id: options.currentUserId, deletedAt: null },
        select: { email: true }
      })
      if (self?.email?.toLowerCase() !== emailRaw.toLowerCase()) {
        return { error: 'You can only import bills for yourself' }
      }
    }
    return { userId: options.currentUserId }
  }

  if (!userIdRaw && !emailRaw) {
    return { error: 'Provide employee userId or email' }
  }

  if (userIdRaw) {
    const id = Number(userIdRaw)
    if (!Number.isInteger(id) || id < 1) {
      return { error: 'Invalid employee userId' }
    }
    const user = await prisma.user.findFirst({
      where: { id, deletedAt: null },
      select: { id: true }
    })
    if (!user) return { error: `Employee not found with id ${id}` }
    return { userId: user.id }
  }

  const user = await prisma.user.findFirst({
    where: {
      email: emailRaw,
      deletedAt: null
    },
    select: { id: true }
  })
  if (!user) return { error: `Employee not found with email ${emailRaw}` }
  return { userId: user.id }
}

const resolveTypeId = async (rawType: string): Promise<{ typeId?: number; error?: string }> => {
  const value = rawType.trim()
  if (!value) return { error: 'Bill type is required' }

  const asId = Number(value)
  if (Number.isInteger(asId) && asId > 0) {
    const option = await prisma.option.findFirst({
      where: {
        id: asId,
        type: OptionType.BILL_TYPE,
        deletedAt: null
      },
      select: { id: true }
    })
    if (!option) return { error: `Bill type not found with id ${asId}` }
    return { typeId: option.id }
  }

  const option = await prisma.option.findFirst({
    where: {
      type: OptionType.BILL_TYPE,
      deletedAt: null,
      name: {
        equals: value
      }
    },
    select: { id: true }
  })
  if (!option) return { error: `Bill type not found: ${value}` }
  return { typeId: option.id }
}

const normalizePurpose = (value?: string | null) => {
  const purpose = (value ?? '').trim()
  return purpose.length ? purpose : null
}

const billFingerprint = (input: TZCreateBill) => {
  const dateKey = startOfDay(input.date).toISOString().slice(0, 10)
  const amountKey = Number(input.amount).toFixed(2)
  const purposeKey = normalizePurpose(input.purpose) ?? ''
  return `${input.userId}|${input.typeId}|${dateKey}|${amountKey}|${purposeKey}`
}

const findDuplicateBill = async (input: TZCreateBill) => {
  const purpose = normalizePurpose(input.purpose)
  return prisma.bill.findFirst({
    where: {
      deletedAt: null,
      userId: input.userId,
      typeId: input.typeId,
      amount: input.amount,
      date: {
        gte: startOfDay(input.date),
        lte: endOfDay(input.date)
      },
      ...(purpose === null
        ? { OR: [{ purpose: null }, { purpose: '' }] }
        : { purpose })
    },
    select: { id: true }
  })
}

export const importBills = async (event: H3Event): Promise<TBillImportResult> => {
  const currentUser = await getCurrentUser(event)
  if (!currentUser.createAnyBills && !currentUser.createOwnBills) {
    throw err.denied()
  }

  const canAssignAny = !!currentUser.createAnyBills

  const file = await readImportFile(event)
  const rows = await parseSpreadsheetFile(file, {
    aliases: HEADER_ALIASES,
    fields: [...FIELDS],
    requiredFields: ['type', 'date', 'amount'],
    requiredMessage: 'Import file must include type, date, and amount columns'
  })

  const failed: TBillImportFailedRow[] = []
  const seenInFile = new Set<string>()
  let imported = 0
  let total = 0

  for (let index = 0; index < rows.length; index++) {
    const raw = rows[index]!
    if (isEmptyRow(raw)) continue

    total += 1
    const rowNumber = index + 2
    const baseFailed = {
      row: rowNumber,
      userId: raw.userId || undefined,
      email: raw.email || undefined,
      type: raw.type || undefined,
      date: raw.date || undefined,
      amount: raw.amount || undefined,
      purpose: raw.purpose || undefined
    }

    const employee = await resolveEmployeeId(raw, {
      currentUserId: currentUser.id,
      canAssignAny
    })
    if (employee.error) {
      failed.push({ ...baseFailed, errors: [employee.error] })
      continue
    }

    const billType = await resolveTypeId(raw.type || '')
    if (billType.error) {
      failed.push({ ...baseFailed, errors: [billType.error] })
      continue
    }

    const payload = {
      userId: employee.userId!,
      typeId: billType.typeId!,
      date: raw.date,
      amount: raw.amount,
      purpose: raw.purpose || null
    }

    const parsed = await zCreateBill.safeParseAsync(payload)
    if (!parsed.success) {
      failed.push({ ...baseFailed, errors: formatZodErrors(parsed.error) })
      continue
    }

    const fingerprint = billFingerprint(parsed.data)
    if (seenInFile.has(fingerprint)) {
      failed.push({
        ...baseFailed,
        errors: ['Duplicate entry in import file (same employee, type, date, amount, purpose)']
      })
      continue
    }

    const existing = await findDuplicateBill(parsed.data)
    if (existing) {
      failed.push({
        ...baseFailed,
        errors: [
          `Duplicate bill already exists (#${existing.id}) with same employee, type, date, amount, and purpose`
        ]
      })
      continue
    }

    try {
      await upsertBill(event, { input: parsed.data })
      seenInFile.add(fingerprint)
      imported += 1
    } catch (error: any) {
      failed.push({
        ...baseFailed,
        errors: [error?.message || 'Failed to import this row']
      })
    }
  }

  if (!total) {
    throw createError({
      statusCode: 422,
      message: 'No bill rows found in the uploaded file'
    })
  }

  return { imported, failed, total }
}

export const getBillImportExample = (event: H3Event) => {
  return writeImportExample(event, EXAMPLE_ROWS, {
    filename: 'bills-import-example',
    headers: [...FIELDS],
    sheetName: 'Bills'
  })
}
