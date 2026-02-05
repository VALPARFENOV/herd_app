/**
 * EVENTS command implementation - Event listing and timeline
 * Supports standard listing and specific items display
 */

import { createClient } from '@/lib/supabase/client'
import { CommandAST } from '../parser-simple'
import { ExecutionResult } from '../executor'

/**
 * Execute EVENTS command
 *
 * Variants:
 * - EVENTS - Standard event listing
 * - EVENTS\si - Specific items display with custom fields
 */
export async function executeEvents(ast: CommandAST): Promise<ExecutionResult> {
  const supabase = createClient()
  const switches = ast.switches || []
  const specificItems = switches.includes('SI')

  try {
    // Get tenant_id from user session
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return {
        success: false,
        type: 'error',
        error: 'User not authenticated'
      }
    }

    const tenantId = user.user_metadata.tenant_id

    if (specificItems) {
      return await eventsSpecificItems(supabase, tenantId, ast.items)
    } else {
      return await eventsStandard(supabase, tenantId, ast.conditions)
    }

  } catch (error) {
    return {
      success: false,
      type: 'error',
      error: error instanceof Error ? error.message : 'EVENTS execution failed'
    }
  }
}

/**
 * EVENTS - Standard event listing
 */
async function eventsStandard(
  supabase: any,
  tenantId: string,
  conditions: any
): Promise<ExecutionResult> {

  // Build query
  let query = supabase
    .from('events')
    .select(`
      id,
      event_date,
      event_type,
      animal_id,
      animals!inner(ear_tag, name),
      details,
      created_at
    `)
    .eq('tenant_id', tenantId)
    .order('event_date', { ascending: false })
    .limit(100)

  // Execute
  const { data, error } = await query

  if (error) {
    return { success: false, type: 'error', error: error.message }
  }

  // Format events for display
  const formattedData = (data || []).map((event: any) => ({
    Date: event.event_date,
    ID: event.animals?.ear_tag || 'N/A',
    Event: formatEventType(event.event_type),
    Details: formatEventDetails(event.event_type, event.details),
    Name: event.animals?.name || ''
  }))

  return {
    success: true,
    type: 'list',
    data: formattedData,
    columns: ['Date', 'ID', 'Event', 'Details', 'Name'],
    count: formattedData.length
  }
}

/**
 * EVENTS\si - Specific items display
 */
async function eventsSpecificItems(
  supabase: any,
  tenantId: string,
  fields?: string[]
): Promise<ExecutionResult> {

  // Get recent events
  const { data, error } = await supabase
    .from('events')
    .select(`
      id,
      event_date,
      event_type,
      animal_id,
      animals!inner(ear_tag, pen_id, lactation_number),
      details,
      created_at
    `)
    .eq('tenant_id', tenantId)
    .order('event_date', { ascending: false })
    .limit(100)

  if (error) {
    return { success: false, type: 'error', error: error.message }
  }

  // Format with specific fields if provided
  const formattedData = (data || []).map((event: any) => {
    const base = {
      Date: event.event_date,
      ID: event.animals?.ear_tag || 'N/A',
      Event: formatEventType(event.event_type)
    }

    // Add custom fields from details
    if (fields && fields.length > 0) {
      for (const field of fields) {
        (base as any)[field] = event.details?.[field.toLowerCase()] || ''
      }
    }

    return base
  })

  const columns = fields && fields.length > 0
    ? ['Date', 'ID', 'Event', ...fields]
    : ['Date', 'ID', 'Event']

  return {
    success: true,
    type: 'list',
    data: formattedData,
    columns,
    count: formattedData.length
  }
}

/**
 * Format event type for display
 */
function formatEventType(eventType: string): string {
  const typeMap: Record<string, string> = {
    'breeding': 'BRED',
    'calving': 'CALVED',
    'dry_off': 'DRY',
    'preg_check': 'PREG CHK',
    'heat': 'HEAT',
    'treatment': 'TREAT',
    'health_check': 'HEALTH',
    'movement': 'MOVED',
    'sale': 'SOLD',
    'death': 'DIED'
  }

  return typeMap[eventType] || eventType.toUpperCase()
}

/**
 * Format event details for display
 */
function formatEventDetails(eventType: string, details: any): string {
  if (!details) return ''

  switch (eventType) {
    case 'breeding':
      return `Bull: ${details.bull_name || details.bull_id || 'N/A'}, Tech: ${details.technician_name || 'N/A'}`

    case 'calving':
      return `Calf: ${details.calf_id || 'N/A'}, Sex: ${details.calf_sex || 'N/A'}`

    case 'preg_check':
      return `Result: ${details.result || 'N/A'}, DCC: ${details.dcc || 'N/A'}`

    case 'treatment':
      return `${details.treatment_type || 'Treatment'}: ${details.drug || 'N/A'}`

    case 'movement':
      return `From: ${details.from_pen || 'N/A'} To: ${details.to_pen || 'N/A'}`

    case 'health_check':
      return `BCS: ${details.bcs || 'N/A'}, Notes: ${details.notes || ''}`

    default:
      // Generic details
      const keys = Object.keys(details).slice(0, 2)
      return keys.map(k => `${k}: ${details[k]}`).join(', ')
  }
}
