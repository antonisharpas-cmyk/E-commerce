/* Imported FIRST by every script. ESM evaluates imports in declaration order,
   so this guarantees process.env is populated before src/db is constructed —
   a dotenv call in the script body runs too late, because the db import is
   hoisted above it. */
import { config } from 'dotenv'
config({ path: ['.env.local', '.env'], quiet: true })
