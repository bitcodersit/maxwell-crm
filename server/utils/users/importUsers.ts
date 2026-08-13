import type { H3Event } from 'h3'
import { CUSTOMER_ROLE_NAME, isCustomerRoleName } from '../customerRole'
import { upsertUser, zUpsertUser } from './upsertUser'

export type TUserImportFailedRow = {
  row: number
  name?: string
  email?: string
  phone?: string
  roles?: string
  errors: string[]
}

export type TUserImportResult = {
  imported: number
  failed: TUserImportFailedRow[]
  total: number
}

const FIELDS = ['name', 'email', 'password', 'phone', 'roles'] as const

const HEADER_ALIASES: Record<string, string> = {
  name: 'name',
  email: 'email',
  password: 'password',
  phone: 'phone',
  roles: 'roles',
  role: 'roles',
  roleids: 'roles',
  'role ids': 'roles',
  role_ids: 'roles'
}

const EXAMPLE_ROWS = [
  {
    name: 'Alice Admin',
    email: 'alice@example.com',
    password: '',
    phone: '01712345678',
    roles: 'Admin'
  },
  {
    name: 'Bob Sales',
    email: 'bob@example.com',
    password: 'Secret123',
    phone: '',
    roles: 'Salesman,Manager'
  }
]

const parseRoleTokens = (value: string) =>
  value
    .split(/[,|;]/)
    .map(token => token.trim())
    .filter(Boolean)

const resolveRoleIds = async (
  rawRoles: string
): Promise<{ roleIds?: number[]; error?: string }> => {
  const tokens = parseRoleTokens(rawRoles)
  if (!tokens.length) {
    return { error: 'At least one role is required' }
  }

  const roleIds: number[] = []
  const seen = new Set<number>()

  for (const token of tokens) {
    const asId = Number(token)
    if (Number.isInteger(asId) && asId > 0 && String(asId) === token) {
      const role = await prisma.role.findFirst({
        where: { id: asId },
        select: { id: true, name: true }
      })
      if (!role) return { error: `Role not found with id ${asId}` }
      if (isCustomerRoleName(role.name)) {
        return { error: `Use the Customers module to assign ${CUSTOMER_ROLE_NAME} role` }
      }
      if (!seen.has(role.id)) {
        seen.add(role.id)
        roleIds.push(role.id)
      }
      continue
    }

    const role = await prisma.role.findFirst({
      where: {
        name: {
          equals: token
        }
      },
      select: { id: true, name: true }
    })
    if (!role) return { error: `Role not found: ${token}` }
    if (isCustomerRoleName(role.name)) {
      return { error: `Use the Customers module to assign ${CUSTOMER_ROLE_NAME} role` }
    }
    if (!seen.has(role.id)) {
      seen.add(role.id)
      roleIds.push(role.id)
    }
  }

  return { roleIds }
}

export const importUsers = async (event: H3Event): Promise<TUserImportResult> => {
  const currentUser = await getCurrentUser(event)
  if (!currentUser.createAnyUsers) {
    throw err.denied()
  }

  const file = await readImportFile(event)
  const rows = await parseSpreadsheetFile(file, {
    aliases: HEADER_ALIASES,
    fields: [...FIELDS],
    requiredFields: ['name', 'email', 'roles'],
    requiredMessage: 'Import file must include name, email, and roles columns'
  })

  const failed: TUserImportFailedRow[] = []
  const seenEmails = new Set<string>()
  let imported = 0
  let total = 0

  for (let index = 0; index < rows.length; index++) {
    const raw = rows[index]!
    if (isEmptyRow(raw)) continue

    total += 1
    const rowNumber = index + 2
    const baseFailed = {
      row: rowNumber,
      name: raw.name || undefined,
      email: raw.email || undefined,
      phone: raw.phone || undefined,
      roles: raw.roles || undefined
    }

    const emailKey = raw.email.trim().toLowerCase()
    if (emailKey && seenEmails.has(emailKey)) {
      failed.push({
        ...baseFailed,
        errors: ['Duplicate email in import file']
      })
      continue
    }

    const roles = await resolveRoleIds(raw.roles || '')
    if (roles.error) {
      failed.push({ ...baseFailed, errors: [roles.error] })
      continue
    }

    const payload = {
      name: raw.name,
      email: raw.email,
      phone: raw.phone || null,
      password: raw.password || null,
      roleIds: roles.roleIds!
    }

    const parsed = await zUpsertUser().safeParseAsync(payload)
    if (!parsed.success) {
      failed.push({ ...baseFailed, errors: formatZodErrors(parsed.error) })
      continue
    }

    try {
      await upsertUser(event, { input: parsed.data })
      if (emailKey) seenEmails.add(emailKey)
      imported += 1
    } catch (error: any) {
      const message =
        error?.data?.properties?.roleIds?.errors?.[0] ||
        error?.message ||
        'Failed to import this row'
      failed.push({
        ...baseFailed,
        errors: [message]
      })
    }
  }

  if (!total) {
    throw createError({
      statusCode: 422,
      message: 'No user rows found in the uploaded file'
    })
  }

  return { imported, failed, total }
}

export const getUserImportExample = (event: H3Event) => {
  return writeImportExample(event, EXAMPLE_ROWS, {
    filename: 'users-import-example',
    headers: [...FIELDS],
    sheetName: 'Users'
  })
}
