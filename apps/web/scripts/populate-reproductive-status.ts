import { Client } from 'pg'
import { config } from 'dotenv'
import { resolve } from 'path'

// Load environment variables
config({ path: resolve(__dirname, '../.env.local') })

async function populateReproductiveStatus() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL
  })

  try {
    console.log('Connecting to database...')
    await client.connect()
    console.log('Connected!')

    console.log('Updating animals with reproductive_status...')

    const updates = [
      { id: 'a0000001-0000-0000-0000-000000000001', status: 'open' },
      { id: 'a0000002-0000-0000-0000-000000000002', status: 'bred' },
      { id: 'a0000003-0000-0000-0000-000000000003', status: 'preg' },
      { id: 'a0000004-0000-0000-0000-000000000004', status: 'fresh' },
      { id: 'a0000005-0000-0000-0000-000000000005', status: 'fresh' },
      { id: 'a0000006-0000-0000-0000-000000000006', status: 'dry' },
      { id: 'a0000007-0000-0000-0000-000000000007', status: 'preg' },
      { id: 'a0000008-0000-0000-0000-000000000008', status: 'blank' },
      { id: 'a0000009-0000-0000-0000-000000000009', status: 'blank' },
      { id: 'a0000010-0000-0000-0000-000000000010', status: 'blank' },
    ]

    for (const { id, status } of updates) {
      await client.query(
        'UPDATE public.animals SET reproductive_status = $1 WHERE id = $2',
        [status, id]
      )
    }

    console.log(`✓ Updated ${updates.length} animals`)

    console.log('\n✅ Success! All animals updated with reproductive_status.')
  } catch (error) {
    console.error('❌ Error:', error)
    process.exit(1)
  } finally {
    await client.end()
  }
}

populateReproductiveStatus()
