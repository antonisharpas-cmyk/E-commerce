/* ============================================================================
 * "Is the database actually usable?"
 *
 * Checked once per process, before the first real query, so a setup problem
 * reports itself as a setup problem. Without this the developer sees whichever
 * select happened to run first, with the real cause ("relation does not exist",
 * "connection refused") buried underneath and often truncated by the error
 * overlay.
 *
 * Two distinct failures, two distinct messages:
 *   - cannot reach the server at all  -> DatabaseUnreachableError
 *   - reached it, but it has no tables -> SchemaNotReadyError
 * ========================================================================== */

import { sql } from 'drizzle-orm'
import { db } from './index'
import { describeConnection } from './ssl'

export class SchemaNotReadyError extends Error {
  constructor(missing: string) {
    super(
      `The database is reachable but empty — the "${missing}" table does not exist.\n\n` +
        'Create the schema and the demo data:\n\n' +
        '    npm run db:push\n' +
        '    npm run db:seed\n',
    )
    this.name = 'SchemaNotReadyError'
  }
}

export class DatabaseUnreachableError extends Error {
  constructor(target: string, cause: string, advice: string) {
    super(
      `Cannot reach the database at ${target}.\n\n${cause}\n\n${advice}\n\n` +
        'For a full diagnosis:  npm run db:check\n',
    )
    this.name = 'DatabaseUnreachableError'
  }
}

/* What each driver failure actually means, and what to do about it. */
function adviceFor(code: string | undefined, message: string, isLocal: boolean): string {
  if (code === 'ECONNREFUSED') {
    return isLocal
      ? 'Nothing is listening on that port. If you are using the embedded database,\n' +
          'the `npm run db:local` terminal has to stay open — start it and leave it\n' +
          'running, then reload this page. If you installed PostgreSQL yourself,\n' +
          'start its service:  Start-Service postgresql-x64-17'
      : 'Nothing is listening there. Check the database is running in your\n' +
          'provider\'s dashboard.'
  }
  if (code === 'ENOTFOUND') {
    return 'That hostname does not resolve. On Render, use the EXTERNAL Database URL —\n' +
      'the internal one only works from inside Render.'
  }
  if (code === 'ETIMEDOUT' || /timeout/i.test(message)) {
    return 'The server did not answer in time. It may be asleep or suspended, or a\n' +
      'network between you and it is blocking the database port.'
  }
  if (/self.signed certificate/i.test(message) || code === 'SELF_SIGNED_CERT_IN_CHAIN') {
    return 'The certificate is not signed by a CA Node trusts. Add this to .env.local:\n\n' +
      '    DATABASE_SSL=no-verify'
  }
  if (/no encryption|SSL.*required|does not support SSL/i.test(message)) {
    return 'That server requires TLS. Add DATABASE_SSL=require to .env.local.'
  }
  if (/password authentication failed/i.test(message)) {
    return 'The password in DATABASE_URL is wrong. Copy the connection string again.'
  }
  if (/database .* does not exist|role .* does not exist/i.test(message)) {
    return 'The database or user named in DATABASE_URL does not exist on that server.'
  }
  return 'Check DATABASE_URL in .env.local.'
}

const globalForReady = globalThis as unknown as { __schemaReady?: Promise<void> }

async function check(): Promise<void> {
  const url = process.env.DATABASE_URL ?? ''
  const isLocal = /localhost|127\.0\.0\.1|\[::1\]/.test(url)

  let result
  try {
    result = await db.execute<{ exists: boolean }>(
      sql`select to_regclass('public.categories') is not null as exists`,
    )
  } catch (err) {
    /* Drizzle wraps driver errors, so the code and message are on the cause. */
    let cursor: unknown = err
    let code: string | undefined
    let message = ''
    for (let i = 0; i < 8 && cursor; i++) {
      const e = cursor as { code?: string; message?: string; cause?: unknown }
      if (typeof e.code === 'string' && !code) code = e.code
      if (e.message) message = e.message
      cursor = e.cause
    }

    throw new DatabaseUnreachableError(
      describeConnection(url),
      `${code ? code + ': ' : ''}${message}`,
      adviceFor(code, message, isLocal),
    )
  }

  if (!result.rows[0]?.exists) throw new SchemaNotReadyError('categories')
}

/** Resolves once the database is reachable and migrated; throws a readable
 *  error if it is not. */
export function assertSchemaReady(): Promise<void> {
  /* Cache the successful answer only. A failed check must be retried, so that
     starting the database or running the migrations and refreshing the page is
     enough — no server restart. */
  if (!globalForReady.__schemaReady) {
    globalForReady.__schemaReady = check().catch((err) => {
      globalForReady.__schemaReady = undefined
      throw err
    })
  }
  return globalForReady.__schemaReady
}
