#!/usr/bin/env node
/**
 * apply-migrations.js - one-shot script to apply initial schema and all SQL migrations.
 *
 * Usage:  DATABASE_URL=postgres://user:pass@host:port/db  node scripts/apply-migrations.js
 *
 * - Reads database/schema.sql first
 * - Sequentially executes every *.sql file in database/migrations in alphabetical order
 * - Skips files that error with "already exists" so the script is idempotent
 */

const fs = require('fs')
const path = require('path')
const { Client } = require('pg')

const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://postgres:FHeFHPzxXbDOSWJHlAHkgCrcMLmEPaeF@interchange.proxy.rlwy.net:42409/railway'

;(async () => {
  const client = new Client({ connectionString: DATABASE_URL, ssl: { rejectUnauthorized: false } })
  try {
    await client.connect()
    console.log('📡 Connected to database')

    // Helper to run a sql file
    const runSQL = async (filePath) => {
      const sql = fs.readFileSync(filePath, 'utf8')
      try {
        await client.query(sql)
        console.log(`✅ Executed ${path.basename(filePath)}`)
      } catch (err) {
        // Ignore "relation already exists" & similar, log others
        if (err.code === '42P07' || /already exists/i.test(err.message)) {
          console.log(`ℹ️  Skipped ${path.basename(filePath)} (already applied)`)  
        } else {
          console.error(`❌ Error running ${filePath}:`, err.message)
          throw err
        }
      }
    }

    // Run main schema first
    await runSQL(path.join(process.cwd(), 'database', 'schema.sql'))

    // Run migrations in order
    const migrationsDir = path.join(process.cwd(), 'database', 'migrations')
    if (fs.existsSync(migrationsDir)) {
      const files = fs.readdirSync(migrationsDir).filter(f => f.endsWith('.sql')).sort()
      for (const file of files) {
        await runSQL(path.join(migrationsDir, file))
      }
    }

    console.log('🏁 All migrations applied')
  } catch (err) {
    console.error('Database migration failed:', err)
    process.exit(1)
  } finally {
    await client.end()
  }
})() 