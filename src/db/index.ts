/* ============================================================================
 * Database client.
 *
 * Uses the standard `pg` driver rather than a serverless HTTP driver on
 * purpose: the inventory reservation logic needs real transactions with
 * SELECT … FOR UPDATE, and HTTP-mode drivers only do single statements.
 * Neon's pooled connection string works with this driver.
 * ========================================================================== */

import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'
import * as schema from './schema'

const connectionString = process.env.DATABASE_URL

if (!connectionString) {
  throw new Error(
    'DATABASE_URL is not set. Copy .env.example to .env.local and fill it in ' +
      '(see README → Database).',
  )
}

/* Next.js dev mode re-evaluates modules on every hot reload. Without this the
   pool count climbs until Postgres refuses new connections. */
const globalForDb = globalThis as unknown as { __pool?: Pool }

/**
 * TLS.
 *
 * A local socket needs none. Every managed Postgres requires it, but they do
 * not all present a certificate chain Node can verify against the system CA
 * store — Render is one that does not, and the failure looks like
 * `SELF_SIGNED_CERT_IN_CHAIN`, which reads like a bug rather than a setting.
 *
 * So verification is on by default and can be turned off deliberately with
 * DATABASE_SSL=no-verify. That still encrypts the connection; it only stops
 * Node checking who signed the certificate. Fine for a hosted database on a
 * private network, and the honest thing to say out loud rather than silently
 * defaulting to it.
 */
function sslOption() {
  const mode = process.env.DATABASE_SSL?.trim().toLowerCase()
  const isLocal = /localhost|127\.0\.0\.1|\/var\/run/.test(connectionString!)

  if (mode === 'disable' || (!mode && isLocal)) return undefined
  if (mode === 'no-verify' || /sslmode=no-verify/.test(connectionString!)) {
    return { rejectUnauthorized: false }
  }
  return { rejectUnauthorized: true }
}

export const pool =
  globalForDb.__pool ??
  new Pool({
    connectionString,
    max: Number(process.env.DATABASE_POOL_MAX ?? 10),
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 10_000,
    ssl: sslOption(),
  })

if (process.env.NODE_ENV !== 'production') globalForDb.__pool = pool

export const db = drizzle(pool, { schema })

export type Db = typeof db

/** A transaction handle, for functions that must run inside one. */
export type Tx = Parameters<Parameters<Db['transaction']>[0]>[0]

export { schema }
