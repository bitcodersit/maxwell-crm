#!/usr/bin/env node
/**
 * Build a cPanel-ready deployment package for Maxwell CRM.
 *
 * What it does:
 *   1. Generates the Prisma client.
 *   2. Builds the Nuxt app (self-contained Nitro `.output`).
 *   3. Stages a `deploy/` folder with:
 *        - the full `.output` (with restored CommonJS package.json markers + Linux sharp binaries)
 *        - a Passenger-friendly startup file (`app.cjs`) with a zero-dependency .env loader
 *        - a minimal `package.json`
 *        - the environment file (`.env`)
 *        - an empty `storage/uploads` directory
 *        - deployment instructions (`README-DEPLOY.md`)
 *   4. Zips the staged contents into `maxwell-crm-deploy.zip` for upload via cPanel File Manager.
 *
 * Usage:
 *   node scripts/build-deploy.mjs [options]
 *
 * Options:
 *   --skip-build           Reuse an existing `.output` (skip prisma generate + nuxt build).
 *   --env <path>           Env file to bundle as `.env` (default: .env.production, fallback: .env).
 *   --sharp-target <t>     Platform for bundled sharp/image binaries.
 *                          One of: linux-x64 (default), linux-musl, linux-arm64.
 *   --no-sharp             Skip bundling Linux sharp binaries.
 *   --no-zip               Stage the `deploy/` folder but don't create the zip.
 */

import { execSync } from 'node:child_process'
import {
  cpSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  statSync,
  writeFileSync
} from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { deflateRawSync } from 'node:zlib'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(__dirname, '..')

// ---------------------------------------------------------------------------
// args
// ---------------------------------------------------------------------------
const args = process.argv.slice(2)
const has = (flag) => args.includes(flag)
const opt = (flag, fallback) => {
  const i = args.indexOf(flag)
  return i !== -1 && args[i + 1] ? args[i + 1] : fallback
}

const SKIP_BUILD = has('--skip-build')
const MAKE_ZIP = !has('--no-zip')
const ENV_ARG = opt('--env', null)
const SKIP_SHARP = has('--no-sharp')
const SHARP_TARGET = opt('--sharp-target', 'linux-x64')

const DEPLOY_DIR = join(ROOT, 'deploy')
const OUTPUT_DIR = join(ROOT, '.output')
const ZIP_NAME = 'maxwell-crm-deploy.zip'
const ZIP_PATH = join(ROOT, ZIP_NAME)

// ---------------------------------------------------------------------------
// helpers
// ---------------------------------------------------------------------------
const log = (msg) => console.log(`\n\x1b[36m▶ ${msg}\x1b[0m`)
const ok = (msg) => console.log(`  \x1b[32m✔\x1b[0m ${msg}`)
const warn = (msg) => console.log(`  \x1b[33m!\x1b[0m ${msg}`)

const run = (cmd) => {
  console.log(`  \x1b[90m$ ${cmd}\x1b[0m`)
  execSync(cmd, { cwd: ROOT, stdio: 'inherit' })
}

// ---------------------------------------------------------------------------
// templates
// ---------------------------------------------------------------------------

// cPanel's Passenger loads this startup file with CommonJS `require()`, so it
// MUST be CommonJS (hence `.cjs`). It loads `.env` (no dependency needed) then
// dynamically imports the ESM Nitro server, which starts listening on import.
// Passenger intercepts the listen() call and wires it to the web server, so no
// PORT configuration is required.
const APP_CJS = `'use strict'
const { readFileSync } = require('node:fs')
const { resolve } = require('node:path')
const { pathToFileURL } = require('node:url')

// Nitro's bundled chunks read \`globalThis._importMeta_.url\` to derive their
// directory (for __dirname, server assets and IPX image storage). Because the
// nitro chunk is evaluated before index.mjs sets the real value, it falls back
// to "file:///_entry.js". We set the correct absolute URL up-front so paths
// resolve to the server directory on every platform.
globalThis._importMeta_ = {
  url: pathToFileURL(resolve(__dirname, '.output/server/index.mjs')).href,
  env: process.env
}

// --- Load .env (zero-dependency parser) ---
try {
  const raw = readFileSync(resolve(__dirname, '.env'), 'utf8')
  for (const line of raw.split(/\\r?\\n/)) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eq = trimmed.indexOf('=')
    if (eq === -1) continue
    const key = trimmed.slice(0, eq).trim()
    let val = trimmed.slice(eq + 1).trim()
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1)
    }
    if (!(key in process.env)) process.env[key] = val
  }
} catch {
  console.warn('[startup] No .env file found; using host environment variables.')
}

process.env.NODE_ENV = process.env.NODE_ENV || 'production'

// --- Boot the Nitro server (starts listening on import) ---
import('./.output/server/index.mjs').catch((err) => {
  console.error('[startup] Failed to start server:', err)
  process.exit(1)
})
`

const PKG_JSON = `${JSON.stringify(
  {
    name: 'maxwell-crm',
    version: '1.0.0',
    private: true,
    scripts: {
      start: 'node app.cjs'
    },
    engines: {
      node: '>=20'
    }
  },
  null,
  2
)}\n`

const README = `# Maxwell CRM — cPanel Deployment (no terminal required)

This package is fully self-contained. You do **not** need to run \`npm install\`,
\`prisma generate\`, or \`nuxt build\` on the server — everything is already bundled
inside \`.output\`.

## Contents

| File / folder     | Purpose                                                      |
| ----------------- | ----------------------------------------------------------- |
| \`.output/\`        | Compiled Nuxt/Nitro server + static assets (self-contained) |
| \`app.cjs\`         | Startup file. Loads \`.env\` and boots the server.            |
| \`.env\`            | Your environment variables (DB, mail, session, etc.).       |
| \`package.json\`    | Minimal manifest with a \`start\` script.                     |
| \`storage/uploads\` | Writable folder for file uploads.                           |

## Steps in cPanel

1. **Upload & extract**
   - Open **File Manager**, go to the folder where the app should live
     (e.g. \`/home/USER/maxwell-crm\` — *not* \`public_html\`).
   - Upload \`${ZIP_NAME}\` and **Extract** it there.

2. **Set up the Node.js app**
   - Open **Setup Node.js App** → **Create Application**.
   - **Node.js version:** 20 or newer.
   - **Application mode:** Production.
   - **Application root:** the folder where you extracted the files.
   - **Application URL:** your domain / subdomain.
   - **Application startup file:** \`app.cjs\`
   - Click **Create**.

3. **(Optional) Environment variables**
   - The app reads everything from the bundled \`.env\`, so you can skip this.
   - If you prefer cPanel-managed vars, add them in the app's
     **Environment variables** section (they take precedence only if you remove
     them from \`.env\`).

4. **Start / Restart**
   - Click **Restart** (or **Start**) in the Node.js App panel.
   - Do **not** click "Run NPM Install" — it isn't needed and can fail because
     dependencies are already bundled.

## Database

The app connects to the database defined in \`.env\`
(\`NUXT_DATABASE_*\`). Make sure that database exists and the schema/migrations
have been applied. Since you have no terminal, apply migrations by importing the
SQL from \`prisma/migrations\` via **phpMyAdmin**, or run
\`npx prisma migrate deploy\` from a machine that can reach the database.

## Uploads

User uploads are written to \`storage/uploads\` (relative to the app root).
Ensure this folder stays writable by the app.

## Architecture note (image optimization)

This package includes the **Linux x64** native \`sharp\` binaries used by
\`@nuxt/image\`. Most cPanel hosts are Linux x64, so it works out of the box.
If your host is different, rebuild with a matching target:

\`\`\`bash
node scripts/build-deploy.mjs --sharp-target linux-arm64   # ARM64 hosts
node scripts/build-deploy.mjs --sharp-target linux-musl    # Alpine/musl hosts
\`\`\`

## Updating later

Re-run \`node scripts/build-deploy.mjs\` locally, upload the new
\`${ZIP_NAME}\`, extract (overwrite), and **Restart** the Node.js app.
`

// ---------------------------------------------------------------------------
// steps
// ---------------------------------------------------------------------------

function build() {
  if (SKIP_BUILD) {
    warn('--skip-build set: reusing existing .output')
    if (!existsSync(OUTPUT_DIR)) {
      throw new Error('.output does not exist. Run without --skip-build first.')
    }
    return
  }

  log('Generating Prisma client')
  run('npm run prisma:generate')
  ok('Prisma client generated')

  log('Building Nuxt app (this can take a while)')
  run('npm run build')
  ok('Nuxt build complete')
}

// Nitro's dependency tracing sometimes drops the nested package.json that
// dual-package modules place in their `commonjs`/`cjs` (or `esm`/`mjs`)
// subfolders. Without it, Node infers the module type from the package root
// (often `"type": "module"`) and fails to load the CommonJS build with
// "exports is not defined in ES module scope". We restore the missing markers.
function patchModuleTypes() {
  const nmDir = join(DEPLOY_DIR, '.output', 'server', 'node_modules')
  if (!existsSync(nmDir)) return

  const CJS_DIRS = new Set(['commonjs', 'cjs'])
  const ESM_DIRS = new Set(['esm', 'es', 'mjs', 'module'])
  let patched = 0

  const walk = (dir) => {
    for (const name of readdirSync(dir)) {
      const abs = join(dir, name)
      if (!statSync(abs).isDirectory()) continue
      const pkg = join(abs, 'package.json')
      if (CJS_DIRS.has(name) && !existsSync(pkg)) {
        writeFileSync(pkg, '{"type":"commonjs"}\n')
        patched++
      } else if (ESM_DIRS.has(name) && !existsSync(pkg)) {
        writeFileSync(pkg, '{"type":"module"}\n')
        patched++
      }
      walk(abs)
    }
  }

  walk(nmDir)
  ok(`Patched ${patched} nested package.json module marker(s)`)
}

function resolveEnvFile() {
  const candidates = ENV_ARG
    ? [ENV_ARG]
    : ['.env.production', '.env']
  for (const c of candidates) {
    const p = resolve(ROOT, c)
    if (existsSync(p)) return p
  }
  return null
}

function stage() {
  log('Staging deploy/ folder')

  rmSync(DEPLOY_DIR, { recursive: true, force: true })
  mkdirSync(DEPLOY_DIR, { recursive: true })

  // 1. .output
  cpSync(OUTPUT_DIR, join(DEPLOY_DIR, '.output'), { recursive: true })
  ok('Copied .output')
  patchModuleTypes()

  // 2. startup file + manifest
  writeFileSync(join(DEPLOY_DIR, 'app.cjs'), APP_CJS)
  writeFileSync(join(DEPLOY_DIR, 'package.json'), PKG_JSON)
  ok('Wrote app.cjs + package.json')

  // 3. env file
  const envFile = resolveEnvFile()
  if (envFile) {
    cpSync(envFile, join(DEPLOY_DIR, '.env'))
    ok(`Bundled ${envFile.replace(ROOT + '\\', '').replace(ROOT + '/', '')} as .env`)
  } else {
    warn('No env file found (.env.production / .env). Creating an empty .env — fill it in before deploying!')
    writeFileSync(join(DEPLOY_DIR, '.env'), '# Fill in your environment variables\n')
  }

  // 4. writable uploads dir
  mkdirSync(join(DEPLOY_DIR, 'storage', 'uploads'), { recursive: true })
  writeFileSync(join(DEPLOY_DIR, 'storage', 'uploads', '.gitkeep'), '')
  ok('Created storage/uploads')

  // 5. docs
  writeFileSync(join(DEPLOY_DIR, 'README-DEPLOY.md'), README)
  ok('Wrote README-DEPLOY.md')
}

// The Nitro build bundles the sharp native binary for the *build machine*
// (e.g. win32-x64), which @nuxt/image needs at runtime for image optimization.
// cPanel hosts are almost always linux-x64, so we fetch and inject the matching
// Linux binaries (using `npm pack`, which ignores the local platform).
function bundleSharp() {
  const sharpPkg = join(
    DEPLOY_DIR,
    '.output/server/node_modules/sharp/package.json'
  )
  if (!existsSync(sharpPkg)) {
    warn('sharp not present in build; skipping platform binary bundling')
    return
  }
  if (SKIP_SHARP) {
    warn('--no-sharp set: NOT bundling Linux sharp binaries (image optimization may fail on the server)')
    return
  }

  const TARGETS = {
    'linux-x64': ['@img/sharp-linux-x64', '@img/sharp-libvips-linux-x64'],
    'linux-musl': ['@img/sharp-linuxmusl-x64', '@img/sharp-libvips-linuxmusl-x64'],
    'linux-arm64': ['@img/sharp-linux-arm64', '@img/sharp-libvips-linux-arm64']
  }
  const wanted = TARGETS[SHARP_TARGET]
  if (!wanted) {
    throw new Error(
      `Unknown --sharp-target "${SHARP_TARGET}". Use one of: ${Object.keys(TARGETS).join(', ')}`
    )
  }

  log(`Bundling sharp binaries for ${SHARP_TARGET}`)

  const optDeps =
    JSON.parse(readFileSync(sharpPkg, 'utf8')).optionalDependencies || {}
  const imgDir = join(DEPLOY_DIR, '.output/server/node_modules/@img')
  mkdirSync(imgDir, { recursive: true })

  const tmp = mkdtempSync(join(tmpdir(), 'crm-sharp-'))
  try {
    for (const name of wanted) {
      const version = optDeps[name]
      if (!version) {
        warn(`sharp does not declare ${name}; skipping`)
        continue
      }
      const base = name.split('/')[1]
      const dest = join(imgDir, base)
      if (existsSync(dest)) {
        ok(`${name} already bundled`)
        continue
      }
      const json = execSync(
        `npm pack ${name}@${version} --pack-destination "${tmp}" --json`,
        { cwd: ROOT }
      ).toString()
      const filename = JSON.parse(json)[0].filename
      const extractDir = join(tmp, base)
      mkdirSync(extractDir, { recursive: true })
      // Run tar from inside `tmp` with relative paths. Absolute Windows paths
      // (e.g. C:\...) break GNU/MSYS tar, which treats the colon as a remote host.
      execSync(`tar -xzf "${filename}" -C "${base}"`, { cwd: tmp })
      cpSync(join(extractDir, 'package'), dest, { recursive: true })
      ok(`Added ${name}@${version}`)
    }
  } finally {
    rmSync(tmp, { recursive: true, force: true })
  }
}

// --- Minimal, dependency-free ZIP writer -----------------------------------
// Always emits forward-slash paths so the archive extracts correctly on the
// Linux cPanel host (PowerShell's Compress-Archive writes backslashes, which
// break there; the `zip` binary isn't available on Windows).

const CRC_TABLE = (() => {
  const t = new Uint32Array(256)
  for (let n = 0; n < 256; n++) {
    let c = n
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    t[n] = c >>> 0
  }
  return t
})()

function crc32(buf) {
  let c = 0xffffffff
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8)
  return (c ^ 0xffffffff) >>> 0
}

function dosDateTime(date) {
  const time =
    (date.getHours() << 11) | (date.getMinutes() << 5) | (date.getSeconds() >> 1)
  const day =
    ((date.getFullYear() - 1980) << 9) | ((date.getMonth() + 1) << 5) | date.getDate()
  return { time: time & 0xffff, date: day & 0xffff }
}

function walkFiles(dir, base = dir, acc = []) {
  for (const name of readdirSync(dir)) {
    const abs = join(dir, name)
    if (statSync(abs).isDirectory()) {
      walkFiles(abs, base, acc)
    } else {
      acc.push({ abs, name: relative(base, abs).split(/[\\/]/).join('/') })
    }
  }
  return acc
}

function createZip(sourceDir, zipPath) {
  const files = walkFiles(sourceDir)
  if (files.length >= 0xffff) {
    throw new Error('Too many files for a standard ZIP (>= 65535). Split the package.')
  }

  const chunks = []
  const central = []
  let offset = 0
  const { time, date } = dosDateTime(new Date())

  for (const file of files) {
    const nameBuf = Buffer.from(file.name, 'utf8')
    const content = readFileSync(file.abs)
    const crc = crc32(content)
    const deflated = deflateRawSync(content)
    const useStore = deflated.length >= content.length
    const method = useStore ? 0 : 8
    const data = useStore ? content : deflated

    const local = Buffer.alloc(30)
    local.writeUInt32LE(0x04034b50, 0)
    local.writeUInt16LE(20, 4)
    local.writeUInt16LE(0x0800, 6) // UTF-8 filename flag
    local.writeUInt16LE(method, 8)
    local.writeUInt16LE(time, 10)
    local.writeUInt16LE(date, 12)
    local.writeUInt32LE(crc, 14)
    local.writeUInt32LE(data.length, 18)
    local.writeUInt32LE(content.length, 22)
    local.writeUInt16LE(nameBuf.length, 26)
    local.writeUInt16LE(0, 28)

    chunks.push(local, nameBuf, data)

    const cd = Buffer.alloc(46)
    cd.writeUInt32LE(0x02014b50, 0)
    cd.writeUInt16LE(0x031e, 4) // version made by: UNIX, spec 3.0
    cd.writeUInt16LE(20, 6)
    cd.writeUInt16LE(0x0800, 8)
    cd.writeUInt16LE(method, 10)
    cd.writeUInt16LE(time, 12)
    cd.writeUInt16LE(date, 14)
    cd.writeUInt32LE(crc, 16)
    cd.writeUInt32LE(data.length, 20)
    cd.writeUInt32LE(content.length, 24)
    cd.writeUInt16LE(nameBuf.length, 28)
    cd.writeUInt16LE(0, 30)
    cd.writeUInt16LE(0, 32)
    cd.writeUInt16LE(0, 34)
    cd.writeUInt16LE(0, 36)
    cd.writeUInt32LE((0o644 << 16) >>> 0, 38) // unix perms rw-r--r--
    cd.writeUInt32LE(offset, 42)

    central.push(cd, nameBuf)
    offset += local.length + nameBuf.length + data.length
  }

  const cdBuf = Buffer.concat(central)
  const eocd = Buffer.alloc(22)
  eocd.writeUInt32LE(0x06054b50, 0)
  eocd.writeUInt16LE(files.length, 8)
  eocd.writeUInt16LE(files.length, 10)
  eocd.writeUInt32LE(cdBuf.length, 12)
  eocd.writeUInt32LE(offset, 16)

  writeFileSync(zipPath, Buffer.concat([...chunks, cdBuf, eocd]))
  return files.length
}

function zip() {
  if (!MAKE_ZIP) {
    warn('--no-zip set: leaving staged files in deploy/')
    return
  }

  log(`Creating ${ZIP_NAME}`)
  rmSync(ZIP_PATH, { force: true })
  const count = createZip(DEPLOY_DIR, ZIP_PATH)
  ok(`Created ${ZIP_NAME} (${count} files)`)
}

// ---------------------------------------------------------------------------
// main
// ---------------------------------------------------------------------------
try {
  build()
  stage()
  bundleSharp()
  zip()

  console.log('\n\x1b[32m✅ Deployment package ready.\x1b[0m')
  if (MAKE_ZIP) {
    console.log(`   Upload \x1b[1m${ZIP_NAME}\x1b[0m to cPanel and extract it in your app root.`)
  }
  console.log('   See \x1b[1mdeploy/README-DEPLOY.md\x1b[0m for step-by-step instructions.\n')
} catch (err) {
  console.error(`\n\x1b[31m✖ ${err.message}\x1b[0m\n`)
  process.exit(1)
}
