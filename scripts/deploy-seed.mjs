#!/usr/bin/env node
/**
 * Self-contained database seed for cPanel (no terminal / no npm install / no WASM).
 *
 * Prisma 7's client uses a WebAssembly query compiler that fails to allocate on
 * memory-constrained shared hosting ("Out of memory: Cannot allocate Wasm
 * memory"). So — exactly like `migrate.mjs` — this seeder talks to the database
 * with raw SQL through the bundled `mariadb` driver instead of the Prisma
 * client. It mirrors `prisma/seed.ts` and is idempotent (safe to re-run).
 *
 * On cPanel: "Setup Node.js App" -> your app -> "Run JS script" -> pick `seed`.
 *
 * Local testing:
 *   node scripts/deploy-seed.mjs --base .
 */

import { existsSync, readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const HERE = dirname(fileURLToPath(import.meta.url))
const args = process.argv.slice(2)
const baseArgIndex = args.indexOf('--base')
const BASE = resolve(baseArgIndex !== -1 && args[baseArgIndex + 1] ? args[baseArgIndex + 1] : HERE)

const require = createRequire(import.meta.url)

function loadEnv(envPath) {
  if (!existsSync(envPath)) {
    console.warn('[seed] No .env file found; relying on host environment variables.')
    return
  }
  const raw = readFileSync(envPath, 'utf8')
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eq = trimmed.indexOf('=')
    if (eq === -1) continue
    const key = trimmed.slice(0, eq).trim()
    let val = trimmed.slice(eq + 1).trim()
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1)
    }
    if (!(key in process.env)) process.env[key] = val
  }
}

function resolveFirst(candidates, what) {
  for (const c of candidates) {
    if (existsSync(c)) return c
  }
  throw new Error(`Could not find ${what}. Looked in:\n  ${candidates.join('\n  ')}`)
}

function loadMariadb() {
  return require(
    resolveFirst(
      [
        join(BASE, '.output/server/node_modules/mariadb/promise.js'),
        join(BASE, 'node_modules/mariadb/promise.js')
      ],
      'the bundled mariadb driver'
    )
  )
}

async function loadGenerateKeyBetween() {
  const file = resolveFirst(
    [
      join(BASE, '.output/server/node_modules/fractional-indexing/src/index.js'),
      join(BASE, 'node_modules/fractional-indexing/src/index.js')
    ],
    'the bundled fractional-indexing module'
  )
  const mod = await import(pathToFileURL(file).href)
  return mod.generateKeyBetween
}

const capitalize = s => s.charAt(0).toUpperCase() + s.slice(1)
const statusToColumnName = status =>
  status
    .toLowerCase()
    .split('_')
    .map(w => capitalize(w))
    .join(' ')

const BOARDS = [
  {
    module: 'TASKS',
    columns: [
      { name: 'Todo', color: '#94a3b8', isDefault: true },
      { name: 'In Progress', color: '#38bdf8' },
      { name: 'In Review', color: '#f59e0b' },
      { name: 'Completed', color: '#10b981' },
      { name: 'Failed', color: '#ef4444' },
      { name: 'Cancelled', color: '#64748b' }
    ]
  },
  {
    module: 'LEADS',
    columns: [
      { name: 'New', color: '#94a3b8', isDefault: true },
      { name: 'Contacted', color: '#38bdf8' },
      { name: 'Qualified', color: '#f59e0b' },
      { name: 'Prospect', color: '#10b981' },
      { name: 'Visit Scheduled', color: '#f59e0b' },
      { name: 'Visit Done', color: '#38bdf8' },
      { name: 'Negotiation', color: '#6366f1' },
      { name: 'Booking', color: '#06b6d4' },
      { name: 'Sold', color: '#22c55e' },
      { name: 'Closed Lost', color: '#ef4444' }
    ]
  }
]

const OPTION_ITEMS = [
  { type: 'SOURCE', options: ['Facebook', 'Website', 'Phone', 'Referral', 'Walk-in'] },
  { type: 'PROPERTY_TYPE_MAIN', options: ['Land', 'Land Share', 'Commercial Plot'] },
  { type: 'PROPERTY_TYPE_SUB', options: ['Ready', 'Ongoing', 'Installment'] },
  { type: 'SIZE', options: ['Katha', 'Sqft'] },
  {
    type: 'PROPERTY_PURCHASE_TYPE',
    options: ['Contracted for sale', 'Power Registration', 'Sab Kobla', 'Ongoing']
  },
  { type: 'BILL_TYPE', options: ['Conveyance', 'Advance', 'Other'] }
]

async function seedRoles(conn) {
  const roles = ['Super Admin', 'Admin', 'Manager', 'Salesman', 'Accountant', 'Customer']
  const values = roles.map(() => '(?, NOW(3), NOW(3))').join(', ')
  await conn.query(
    `INSERT INTO \`roles\` (\`name\`, \`createdAt\`, \`updatedAt\`) VALUES ${values}
     ON DUPLICATE KEY UPDATE \`name\` = VALUES(\`name\`)`,
    roles
  )
  console.log(`[seed] ✔ roles (${roles.length})`)
}

async function seedPermissions(conn) {
  const operations = ['create', 'read', 'update', 'delete', 'export']
  const modules = [
    'users',
    'roles',
    'permissions',
    'teams',
    'attachments',
    'tasks',
    'leads',
    'properties',
    'bills'
  ]
  const subjects = ['any', 'own']

  const names = operations.flatMap(op =>
    modules.flatMap(mod => subjects.map(sub => `${op}-${sub}-${mod}`))
  )

  const values = names.map(() => '(?, NOW(3), NOW(3))').join(', ')
  await conn.query(
    `INSERT INTO \`permissions\` (\`name\`, \`createdAt\`, \`updatedAt\`) VALUES ${values}
     ON DUPLICATE KEY UPDATE \`name\` = VALUES(\`name\`)`,
    names
  )
  console.log(`[seed] ✔ permissions (${names.length})`)
}

async function seedSuperAdmin(conn) {
  const [role] = await conn.query('SELECT `id` FROM `roles` WHERE `name` = ? LIMIT 1', [
    'Super Admin'
  ])
  if (!role) throw new Error('Super Admin role missing after seeding roles')
  const superAdminRoleId = role.id

  const permissions = await conn.query('SELECT `id` FROM `permissions`')
  if (permissions.length) {
    const values = permissions.map(() => '(?, ?)').join(', ')
    const params = permissions.flatMap(p => [superAdminRoleId, p.id])
    await conn.query(
      `INSERT IGNORE INTO \`role_permissions\` (\`roleId\`, \`permissionId\`) VALUES ${values}`,
      params
    )
  }
  console.log(`[seed] ✔ Super Admin role permissions (${permissions.length})`)

  const email = process.env.NUXT_SUPER_ADMIN_EMAIL
  const password = process.env.NUXT_SUPER_ADMIN_PASSWORD
  if (!email || !password) {
    console.warn(
      '[seed] ! NUXT_SUPER_ADMIN_EMAIL / NUXT_SUPER_ADMIN_PASSWORD not set; skipping super-admin user'
    )
    return
  }

  await conn.query(
    `INSERT INTO \`users\` (\`name\`, \`email\`, \`password\`, \`createdAt\`, \`updatedAt\`)
     VALUES (?, ?, ?, NOW(3), NOW(3))
     ON DUPLICATE KEY UPDATE \`email\` = VALUES(\`email\`)`,
    ['Super Admin', email, password]
  )

  const [user] = await conn.query('SELECT `id` FROM `users` WHERE `email` = ? LIMIT 1', [email])
  if (user) {
    await conn.query('INSERT IGNORE INTO `user_roles` (`userId`, `roleId`) VALUES (?, ?)', [
      user.id,
      superAdminRoleId
    ])
  }
  console.log(`[seed] ✔ Super Admin user (${email})`)
}

async function seedBoards(conn, generateKeyBetween) {
  for (const board of BOARDS) {
    await conn.query(
      `INSERT INTO \`boards\` (\`name\`, \`module\`, \`isDefault\`, \`createdAt\`, \`updatedAt\`)
       VALUES ('default', ?, 1, NOW(3), NOW(3))
       ON DUPLICATE KEY UPDATE \`isDefault\` = VALUES(\`isDefault\`)`,
      [board.module]
    )

    const [row] = await conn.query(
      'SELECT `id` FROM `boards` WHERE `module` = ? AND `name` = ? LIMIT 1',
      [board.module, 'default']
    )
    const boardId = row.id

    let prevKey = null
    for (const column of board.columns) {
      const sortOrder = generateKeyBetween(prevKey, null)
      prevKey = sortOrder
      await conn.query(
        `INSERT INTO \`board_columns\`
           (\`boardId\`, \`name\`, \`color\`, \`isDefault\`, \`sortOrder\`, \`createdAt\`, \`updatedAt\`)
         VALUES (?, ?, ?, ?, ?, NOW(3), NOW(3))
         ON DUPLICATE KEY UPDATE \`color\` = VALUES(\`color\`), \`isDefault\` = VALUES(\`isDefault\`)`,
        [boardId, column.name, column.color, column.isDefault ? 1 : 0, sortOrder]
      )
    }
    console.log(`[seed] ✔ ${board.module} board + ${board.columns.length} columns`)

    await backfillBoardItems(conn, generateKeyBetween, board.module, boardId)
  }
}

// Assign pre-existing tasks/leads (if any) to the default board. On a fresh
// install there are none, so this is a no-op.
async function backfillBoardItems(conn, generateKeyBetween, module, boardId) {
  const columns = await conn.query('SELECT `id`, `name` FROM `board_columns` WHERE `boardId` = ?', [
    boardId
  ])
  const columnByName = new Map(columns.map(c => [c.name, c.id]))
  const firstColumnId = columns[0]?.id

  if (module === 'TASKS') {
    const tasks = await conn.query(
      `SELECT t.\`id\`, t.\`status\` FROM \`tasks\` t
       WHERE t.\`deletedAt\` IS NULL
         AND NOT EXISTS (SELECT 1 FROM \`board_items\` bi WHERE bi.\`boardId\` = ? AND bi.\`taskId\` = t.\`id\`)`,
      [boardId]
    )
    let prevKey = null
    let count = 0
    for (const task of tasks) {
      const columnId = columnByName.get(statusToColumnName(task.status)) ?? firstColumnId
      if (!columnId) continue
      const sortOrder = generateKeyBetween(prevKey, null)
      prevKey = sortOrder
      await conn.query(
        `INSERT IGNORE INTO \`board_items\` (\`boardId\`, \`columnId\`, \`taskId\`, \`sortOrder\`, \`createdAt\`, \`updatedAt\`)
         VALUES (?, ?, ?, ?, NOW(3), NOW(3))`,
        [boardId, columnId, task.id, sortOrder]
      )
      count++
    }
    if (count) console.log(`[seed]   backfilled ${count} task(s) onto the board`)
  } else if (module === 'LEADS' && firstColumnId) {
    const leads = await conn.query(
      `SELECT l.\`id\` FROM \`leads\` l
       WHERE l.\`deletedAt\` IS NULL
         AND NOT EXISTS (SELECT 1 FROM \`board_items\` bi WHERE bi.\`boardId\` = ? AND bi.\`leadId\` = l.\`id\`)`,
      [boardId]
    )
    let prevKey = null
    let count = 0
    for (const lead of leads) {
      const sortOrder = generateKeyBetween(prevKey, null)
      prevKey = sortOrder
      await conn.query(
        `INSERT IGNORE INTO \`board_items\` (\`boardId\`, \`columnId\`, \`leadId\`, \`sortOrder\`, \`createdAt\`, \`updatedAt\`)
         VALUES (?, ?, ?, ?, NOW(3), NOW(3))`,
        [boardId, firstColumnId, lead.id, sortOrder]
      )
      count++
    }
    if (count) console.log(`[seed]   backfilled ${count} lead(s) onto the board`)
  }
}

async function seedOptions(conn) {
  const rows = OPTION_ITEMS.flatMap(item => item.options.map(name => ({ name, type: item.type })))
  const values = rows.map(() => '(?, ?, NOW(3), NOW(3))').join(', ')
  const params = rows.flatMap(r => [r.name, r.type])
  await conn.query(
    `INSERT IGNORE INTO \`options\` (\`name\`, \`type\`, \`createdAt\`, \`updatedAt\`) VALUES ${values}`,
    params
  )
  console.log(`[seed] ✔ options (${rows.length})`)
}

async function main() {
  loadEnv(join(BASE, '.env'))

  const config = {
    host: process.env.NUXT_DATABASE_HOST,
    user: process.env.NUXT_DATABASE_USER,
    password: process.env.NUXT_DATABASE_PASSWORD,
    database: process.env.NUXT_DATABASE_NAME,
    port: Number(process.env.NUXT_DATABASE_PORT) || 3306,
    allowPublicKeyRetrieval: true
  }

  if (!config.host || !config.user || !config.database) {
    throw new Error(
      'Missing database configuration. Ensure NUXT_DATABASE_HOST / USER / NAME are set in .env.'
    )
  }

  const mariadb = loadMariadb()
  const generateKeyBetween = await loadGenerateKeyBetween()

  console.log(`[seed] Connecting to ${config.database} @ ${config.host}:${config.port} ...`)

  let conn
  try {
    conn = await mariadb.createConnection(config)
  } catch (error) {
    console.error('[seed] Failed to connect to the database:')
    console.error(`       ${error?.message || error}`)
    process.exitCode = 1
    return
  }

  try {
    await seedRoles(conn)
    await seedPermissions(conn)
    await seedSuperAdmin(conn)
    await seedBoards(conn, generateKeyBetween)
    await seedOptions(conn)
    console.log('[seed] Done. Database seeded successfully.')
  } finally {
    try {
      await conn.end()
    } catch {
      // ignore
    }
  }
}

main().catch(error => {
  console.error('[seed] Unexpected error:', error?.message || error)
  process.exit(1)
})
