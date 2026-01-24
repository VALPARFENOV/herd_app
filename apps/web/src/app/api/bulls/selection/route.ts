import { NextResponse } from 'next/server'
import { getActiveBullsForSelection } from '@/lib/data/bulls'

export async function GET() {
  try {
    const bulls = await getActiveBullsForSelection()
    return NextResponse.json(bulls)
  } catch (error) {
    console.error('Error fetching bulls:', error)
    return NextResponse.json({ error: 'Failed to fetch bulls' }, { status: 500 })
  }
}
