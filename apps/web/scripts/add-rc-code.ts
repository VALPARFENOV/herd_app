import { Client } from 'pg'
import { config } from 'dotenv'
import { resolve } from 'path'

// Load environment variables
config({ path: resolve(__dirname, '../.env.local') })

async function addRcCodeColumn() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL
  })

  try {
    console.log('Connecting to database...')
    await client.connect()
    console.log('Connected!')

    console.log('Adding rc_code column to animals table...')

    await client.query(`
      ALTER TABLE public.animals
      ADD COLUMN IF NOT EXISTS rc_code INTEGER DEFAULT 0 CHECK (rc_code >= 0 AND rc_code <= 8);
    `)
    console.log('✓ Column added')

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_animals_rc_code ON public.animals(tenant_id, rc_code);
    `)
    console.log('✓ Index created')

    const result = await client.query(`
      UPDATE public.animals
      SET rc_code = CASE
          WHEN current_status = 'heifer' THEN 0
          WHEN current_status = 'fresh' THEN 2
          WHEN current_status = 'lactating' THEN 3
          WHEN current_status = 'dry' THEN 6
          WHEN current_status = 'sold' OR current_status = 'died' THEN 7
          ELSE 0
      END
      WHERE rc_code = 0 OR rc_code IS NULL;
    `)
    console.log(`✓ Updated ${result.rowCount} rows`)

    console.log('\n✅ Success! rc_code column added and populated.')
  } catch (error) {
    console.error('❌ Error:', error)
    process.exit(1)
  } finally {
    await client.end()
  }
}

addRcCodeColumn()
