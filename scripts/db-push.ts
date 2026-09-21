/* Applies migrations, then the hand-written invariants in constraints.sql.
   Always run together: a migration that adds a table without its CHECK
   constraints leaves a window where bad data can land. */
import './load-env'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { Pool } from 'pg'
import { drizzle } from 'drizzle-orm/node-postgres'
import { migrate } from 'drizzle-orm/node-postgres/migrator'

const pool = new Pool({ connectionString: process.env.DATABASE_URL })

async function main() {
  const db = drizzle(pool)
  console.log('→ applying migrations')
  await migrate(db, { migrationsFolder: './drizzle' })

  console.log('→ applying constraints.sql')
  const sql = readFileSync(join(process.cwd(), 'src/db/constraints.sql'), 'utf8')
  await pool.query(sql)

  console.log('✓ schema is up to date')
}

main()
  .catch((err) => {
    console.error('✗ schema push failed:', err.message)
    process.exitCode = 1
  })
  .finally(() => pool.end())
