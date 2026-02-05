import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST() {
  const supabase = await createClient()

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

  const results = []
  for (const { id, status } of updates) {
    const { error } = await supabase
      .from('animals')
      .update({ reproductive_status: status })
      .eq('id', id)

    if (error) {
      results.push({ id, status, error: error.message })
    } else {
      results.push({ id, status, success: true })
    }
  }

  return NextResponse.json({
    success: true,
    updated: results.filter(r => r.success).length,
    errors: results.filter(r => r.error),
    results
  })
}
