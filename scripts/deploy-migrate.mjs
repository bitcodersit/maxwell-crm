#!/usr/bin/env node
/**
 * Self-contained Prisma migration runner for cPanel (no terminal / no npm install).
 *
 * This script applies the SQL files in `prisma/migrations` to the database,
 * tracking them in the `_prisma_migrations` table exactly like
 * `prisma migrate deploy` — but WITHOUT needing the Prisma CLI. It reuses the
 * `mariadb` driver that is already bundled inside `.output`.
 *
 * On cPanel: "Setup Node.js App" -> your app -> "Run JS script" -> pick the
 * `migrate` script (defined in package.json). It runs `node migrate.mjs`.
 *
 * It is idempotent: already-applied migrations are skipped.
 *
 * Local testing:
 *   node scripts/deploy-migrate.mjs --base .
 *   (uses the repo's `.output`, `prisma/migrations` and `.env`)
 */

import { createHash, randomUUID } from 'node:crypto'
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const HERE = dirname(fileURLToPath(import.meta.url))

// --base lets the same file run both from the deploy root (default) and from
// the repo during local testing.
const args = process.argv.slice(2)
const baseArgIndex = args.indexOf('--base')
const BASE = resolve(baseArgIndex !== -1 && args[baseArgIndex + 1] ? args[baseArgIndex + 1] : HERE)

const require = createRequire(import.meta.url)

function loadEnv(envPath) {
  if (!existsSync(envPath)) {
    console.warn('[migrate] No .env file found; relying on host environment variables.')
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

function loadMariadb() {
  const candidates = [
    join(BASE, '.output/server/node_modules/mariadb/promise.js'),
    join(BASE, 'node_modules/mariadb/promise.js')
  ]
  for (const c of candidates) {
    if (existsSync(c)) return require(c)
  }
  throw new Error(
    `Could not find the bundled mariadb driver. Looked in:\n  ${candidates.join('\n  ')}`
  )
}

const CREATE_MIGRATIONS_TABLE = `CREATE TABLE IF NOT EXISTS \`_prisma_migrations\` (
  \`id\` VARCHAR(36) NOT NULL,
  \`checksum\` VARCHAR(64) NOT NULL,
  \`finished_at\` DATETIME(3) NULL,
  \`migration_name\` VARCHAR(255) NOT NULL,
  \`logs\` TEXT NULL,
  \`rolled_back_at\` DATETIME(3) NULL,
  \`started_at\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  \`applied_steps_count\` INTEGER UNSIGNED NOT NULL DEFAULT 0,
  PRIMARY KEY (\`id\`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`

async function main() {
  loadEnv(join(BASE, '.env'))

  const migrationsDir = join(BASE, 'prisma', 'migrations')
  if (!existsSync(migrationsDir)) {
    throw new Error(`No migrations directory found at ${migrationsDir}`)
  }

  const folders = readdirSync(migrationsDir)
    .filter(f => statSync(join(migrationsDir, f)).isDirectory())
    .filter(f => existsSync(join(migrationsDir, f, 'migration.sql')))
    .sort()

  if (folders.length === 0) {
    console.log('[migrate] No migrations found. Nothing to do.')
    return
  }

  const mariadb = loadMariadb()

  const config = {
    host: process.env.NUXT_DATABASE_HOST,
    user: process.env.NUXT_DATABASE_USER,
    password: process.env.NUXT_DATABASE_PASSWORD,
    database: process.env.NUXT_DATABASE_NAME,
    port: Number(process.env.NUXT_DATABASE_PORT) || 3306,
    allowPublicKeyRetrieval: true,
    multipleStatements: true
  }

  if (!config.host || !config.user || !config.database) {
    throw new Error(
      'Missing database configuration. Ensure NUXT_DATABASE_HOST / USER / NAME are set in .env.'
    )
  }

  console.log(`[migrate] Connecting to ${config.database} @ ${config.host}:${config.port} ...`)

  let conn
  try {
    conn = await mariadb.createConnection(config)
  } catch (error) {
    console.error('[migrate] Failed to connect to the database:')
    console.error(`          ${error?.message || error}`)
    process.exitCode = 1
    return
  }

  try {
    await conn.query(CREATE_MIGRATIONS_TABLE)

    const appliedRows = await conn.query(
      'SELECT migration_name, checksum, finished_at FROM `_prisma_migrations`'
    )
    const applied = new Map(appliedRows.map(r => [r.migration_name, r]))

    let pending = 0
    let done = 0

    for (const name of folders) {
      const sqlPath = join(migrationsDir, name, 'migration.sql')
      const sql = readFileSync(sqlPath)
      const checksum = createHash('sha256').update(sql).digest('hex')

      const existing = applied.get(name)
      if (existing && existing.finished_at) {
        if (existing.checksum !== checksum) {
          console.warn(
            `[migrate] ! ${name} already applied but checksum differs (migration file changed after being applied).`
          )
        } else {
          console.log(`[migrate] = ${name} (already applied)`)
        }
        continue
      }

      pending++
      const startedAt = new Date()
      console.log(`[migrate] + Applying ${name} ...`)

      try {
        await conn.query(sql.toString('utf8'))
      } catch (error) {
        console.error(`[migrate] x Failed while applying ${name}:`)
        console.error(`          ${error?.message || error}`)
        // Record the failed attempt (Prisma-style: finished_at stays NULL).
        try {
          await conn.query(
            'INSERT INTO `_prisma_migrations` (`id`,`checksum`,`migration_name`,`logs`,`started_at`,`applied_steps_count`) VALUES (?,?,?,?,?,0)',
            [randomUUID(), checksum, name, String(error?.message || error), startedAt]
          )
        } catch {
          // ignore bookkeeping failure
        }
        process.exitCode = 1
        return
      }

      const finishedAt = new Date()
      await conn.query(
        'INSERT INTO `_prisma_migrations` (`id`,`checksum`,`migration_name`,`started_at`,`finished_at`,`applied_steps_count`) VALUES (?,?,?,?,?,1)',
        [randomUUID(), checksum, name, startedAt, finishedAt]
      )
      done++
      console.log(`[migrate] ✔ Applied ${name}`)
    }

    if (pending === 0) {
      console.log('[migrate] Database is already up to date. No migrations applied.')
    } else {
      console.log(`[migrate] Done. Applied ${done}/${pending} pending migration(s).`)
    }
  } finally {
    try {
      await conn.end()
    } catch {
      // ignore
    }
  }
}

main().catch(error => {
  console.error('[migrate] Unexpected error:', error?.message || error)
  process.exit(1)
})
