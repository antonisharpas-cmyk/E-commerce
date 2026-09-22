/* ============================================================================
 * "Is the database actually set up?"
 *
 * A connected-but-empty database fails on the first real query, and what the
 * developer sees is a wall of SQL — the select that happened to run first —
 * with the cause ("relation categories does not exist") buried underneath and
 * often truncated by the error overlay. The missing step is two commands, so
 * say so instead.
 *
 * Checked once per process, not once per request.
 * ========================================================================== */

import { sql } from 'drizzle-orm'
import { db } from './index'

export class SchemaNotReadyError extends Error {
  constructor(missing: string) {
    super(
      `The database is reachable but empty — the "${missing}" table does not exist. ` +
        'Create the schema and demo data:\n\n' +
        '    npm run db:push\n' +
        '    npm run db:seed\n',
    )
    this.name = 'SchemaNotReadyError'
  }
}

const globalForReady = globalThis as unknown as { __schemaReady?: Promise<void> }

async function check(): Promise<void> {
  const result = await db.execute<{ exists: boolean }>(
    sql`select to_regclass('public.categories') is not null as exists`,
  )
  if (!result.rows[0]?.exists) throw new SchemaNotReadyError('categories')
}

/** Resolves once the schema exists; throws a readable error if it does not. */
export function assertSchemaReady(): Promise<void> {
  /* Cache the successful answer only. A failed check must be retried, so the
     developer can run the migrations and simply refresh the page. */
  if (!globalForReady.__schemaReady) {
    globalForReady.__schemaReady = check().catch((err) => {
      globalForReady.__schemaReady = undefined
      throw err
    })
  }
  return globalForReady.__schemaReady
}
