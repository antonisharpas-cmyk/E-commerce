/* ==========================================================================
   LOCAL API SERVER — development only.

   Vercel runs each file in /api as its own serverless function. `vercel dev`
   can emulate that but needs you to log in and link a project, which is
   friction you don't want five minutes before a meeting.

   This mounts the very same handler files on a plain Node server, so:
       npm run dev   →  Vite on :5173  +  this on :3001, proxied at /api
   and the handlers you test locally are byte-for-byte the ones that deploy.

   Never used in production. There is no `express` dependency — Node's own
   http module is enough.
   ========================================================================== */

import { createServer } from 'node:http'
import { readdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const PORT = Number(process.env.API_PORT ?? 3001)
const apiDir = join(dirname(fileURLToPath(import.meta.url)), '..', 'api')

/* load .env.local then .env, without adding a dotenv dependency */
async function loadEnv() {
  const { readFileSync, existsSync } = await import('node:fs')
  for (const file of ['.env.local', '.env']) {
    const path = join(apiDir, '..', file)
    if (!existsSync(path)) continue
    for (const line of readFileSync(path, 'utf8').split('\n')) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/i)
      if (!m) continue
      const [, k, rawV] = m
      if (process.env[k] !== undefined) continue // real env wins
      process.env[k] = rawV.replace(/^["']|["']$/g, '')
    }
    console.log(`  loaded ${file}`)
  }
}

const routes = new Map()

async function loadRoutes() {
  for (const entry of readdirSync(apiDir, { withFileTypes: true })) {
    if (!entry.isFile() || !entry.name.endsWith('.js')) continue
    const name = entry.name.replace(/\.js$/, '')
    const mod = await import(pathToFileURL(join(apiDir, entry.name)).href)
    if (typeof mod.default === 'function') routes.set(`/api/${name}`, mod.default)
  }
}

await loadEnv()

/* Dev convenience only: the production rate limit would trip while you click
   around or run the test suite. Never set this on Vercel. */
if (!process.env.RATE_LIMIT_MAX) process.env.RATE_LIMIT_MAX = '500'

await loadRoutes()

const server = createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`)
  const handler = routes.get(url.pathname)

  if (!handler) {
    res.statusCode = 404
    res.setHeader('Content-Type', 'application/json')
    return res.end(JSON.stringify({ error: 'NO_SUCH_ENDPOINT', path: url.pathname }))
  }

  // mimic the two conveniences Vercel's runtime provides
  req.query = Object.fromEntries(url.searchParams)
  if (req.method === 'POST' || req.method === 'PUT') {
    const chunks = []
    for await (const c of req) chunks.push(c)
    const raw = Buffer.concat(chunks).toString('utf8')
    try {
      req.body = raw ? JSON.parse(raw) : undefined
    } catch {
      req.body = undefined
    }
  }

  const started = Date.now()
  try {
    await handler(req, res)
  } catch (err) {
    console.error(`[dev-api] ${req.method} ${url.pathname} threw:`, err)
    if (!res.headersSent) {
      res.statusCode = 500
      res.setHeader('Content-Type', 'application/json')
      res.end(JSON.stringify({ error: 'HANDLER_THREW', message: err.message }))
    }
  }
  console.log(`  ${req.method} ${url.pathname} → ${res.statusCode} (${Date.now() - started}ms)`)
})

server.listen(PORT, () => {
  const live = process.env.VIVA_ENV === 'production'
  console.log(`\n  API listening on http://localhost:${PORT}`)
  console.log(`  routes: ${[...routes.keys()].join(', ')}`)
  console.log(
    `  Viva env: ${live ? '🔴 PRODUCTION — REAL MONEY' : '🟢 demo (sandbox, nothing is charged)'}`,
  )
  if (!process.env.VIVA_CLIENT_ID) {
    console.log(
      `  ⚠️  VIVA_CLIENT_ID not set — card checkout will return 500.\n` +
        `     Cash-on-delivery and reserve-in-shop still work without it.`,
    )
  }
  console.log('')
})
