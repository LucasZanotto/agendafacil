import 'server-only'
import type { PgDatabase, PgQueryResultHKT } from 'drizzle-orm/pg-core'
import { sql } from 'drizzle-orm'
import * as schema from './schema'
import { seedDemo } from './seed'

export type DB = PgDatabase<PgQueryResultHKT, typeof schema>

const globalForDb = globalThis as unknown as { dbPromise?: Promise<DB> }

/**
 * Com DATABASE_URL → PostgreSQL de verdade (Neon, Supabase, etc.).
 * Sem DATABASE_URL → PGlite: um Postgres completo rodando dentro do Node, salvo em .data/
 * (o mesmo SQL funciona nos dois casos).
 */
async function connect(): Promise<DB> {
  let db: DB
  if (process.env.DATABASE_URL) {
    const { Pool } = await import('pg')
    const { drizzle } = await import('drizzle-orm/node-postgres')
    const pool = new Pool({ connectionString: process.env.DATABASE_URL, max: 5 })
    db = drizzle(pool, { schema }) as unknown as DB
    await pool.query(schema.DDL)
  } else {
    const { PGlite } = await import('@electric-sql/pglite')
    const { drizzle } = await import('drizzle-orm/pglite')
    const { mkdirSync } = await import('node:fs')
    mkdirSync('./.data', { recursive: true })
    const client = new PGlite('./.data/pglite')
    await client.exec(schema.DDL)
    db = drizzle(client, { schema }) as unknown as DB
  }

  const [{ count }] = await db.select({ count: sql<number>`count(*)::int` }).from(schema.businesses)
  if (count === 0) await seedDemo(db)
  return db
}

export function getDb() {
  globalForDb.dbPromise ??= connect().catch((err) => {
    globalForDb.dbPromise = undefined
    throw err
  })
  return globalForDb.dbPromise
}

export { schema }
