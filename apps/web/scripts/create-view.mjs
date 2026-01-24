import pg from 'pg';
const { Client } = pg;
import dotenv from 'dotenv';
import { resolve } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: resolve(__dirname, '../.env.local') });

async function createView() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL
  });

  try {
    console.log('Connecting to database...');
    await client.connect();
    console.log('Connected!');

    console.log('Creating animals_with_calculated view...');

    await client.query(`
      CREATE OR REPLACE VIEW public.animals_with_calculated AS
      SELECT
        a.*,

        -- DIM: Days in Milk (days since last calving)
        CASE
          WHEN a.last_calving_date IS NOT NULL
          THEN EXTRACT(DAY FROM (CURRENT_DATE - a.last_calving_date))::INTEGER
          ELSE NULL
        END AS dim,

        -- DCC: Days Carrying Calf (days pregnant, for stельных коров)
        CASE
          WHEN a.conception_date IS NOT NULL AND a.reproductive_status IN ('preg', 'dry')
          THEN EXTRACT(DAY FROM (CURRENT_DATE - a.conception_date))::INTEGER
          ELSE NULL
        END AS days_carrying_calf,

        -- DUE: Days to Calving (280 - DCC)
        CASE
          WHEN a.conception_date IS NOT NULL AND a.reproductive_status IN ('preg', 'dry')
          THEN 280 - EXTRACT(DAY FROM (CURRENT_DATE - a.conception_date))::INTEGER
          ELSE NULL
        END AS days_to_calving,

        -- AGE: Age in months
        CASE
          WHEN a.birth_date IS NOT NULL
          THEN EXTRACT(YEAR FROM AGE(CURRENT_DATE, a.birth_date))::INTEGER * 12 +
               EXTRACT(MONTH FROM AGE(CURRENT_DATE, a.birth_date))::INTEGER
          ELSE NULL
        END AS age_months,

        -- DOPN: Days Open (days since calving for non-pregnant cows)
        CASE
          WHEN a.last_calving_date IS NOT NULL
               AND a.reproductive_status NOT IN ('preg', 'dry', 'blank')
          THEN EXTRACT(DAY FROM (CURRENT_DATE - a.last_calving_date))::INTEGER
          ELSE NULL
        END AS days_open,

        -- DSLH: Days Since Last Heat
        CASE
          WHEN a.last_heat_date IS NOT NULL
          THEN EXTRACT(DAY FROM (CURRENT_DATE - a.last_heat_date))::INTEGER
          ELSE NULL
        END AS days_since_last_heat

      FROM public.animals a;
    `);

    console.log('✓ View created');

    // Grant permissions
    await client.query(`
      GRANT SELECT ON public.animals_with_calculated TO anon, authenticated, service_role;
    `);

    console.log('✓ Permissions granted');

    // Test the view
    const result = await client.query(`
      SELECT ear_tag, dim, days_to_calving, reproductive_status
      FROM public.animals_with_calculated
      WHERE last_calving_date IS NOT NULL
      LIMIT 5;
    `);

    console.log('\n✅ View created successfully!');
    console.log('\nTest query results:');
    console.table(result.rows);

  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.detail) console.error('Detail:', error.detail);
    process.exit(1);
  } finally {
    await client.end();
  }
}

createView();
