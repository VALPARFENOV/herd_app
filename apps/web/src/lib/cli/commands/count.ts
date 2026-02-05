/**
 * COUNT command implementation
 * Supports:
 * - COUNT ID - simple count
 * - COUNT ID FOR RC=5 - count with conditions
 * - COUNT BY PEN - grouped count
 * - COUNT ID BY RC - grouped count
 */

import { createClient } from '@/lib/supabase/client'
import { CommandAST, Condition } from '../parser-simple'
import { dairyCompToDb } from '../field-mapping'
import { ExecutionResult } from '../executor'

/**
 * Execute COUNT command
 */
export async function executeCount(ast: CommandAST): Promise<ExecutionResult> {
  const supabase = createClient()

  try {
    // Check if this is a grouped count (COUNT BY <field>)
    if (ast.groupBy) {
      return await executeGroupedCount(ast, supabase)
    } else {
      return await executeSimpleCount(ast, supabase)
    }
  } catch (error) {
    return {
      success: false,
      type: 'error',
      error: error instanceof Error ? error.message : 'COUNT execution failed'
    }
  }
}

/**
 * Simple count: COUNT ID FOR RC=5
 */
async function executeSimpleCount(
  ast: CommandAST,
  supabase: any
): Promise<ExecutionResult> {
  try {
    // Build conditions for RPC call
    const conditions = buildConditionsJSON(ast.conditions || [])

    // Get tenant_id from user session
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return {
        success: false,
        type: 'error',
        error: 'User not authenticated'
      }
    }

    // Call RPC function
    const { data, error } = await supabase.rpc('count_animals', {
      p_tenant_id: user.user_metadata.tenant_id,
      p_conditions: conditions
    })

    if (error) {
      return {
        success: false,
        type: 'error',
        error: error.message
      }
    }

    return {
      success: true,
      type: 'count',
      count: data,
      data: [{
        label: 'Count',
        value: data
      }],
      columns: ['Count']
    }
  } catch (error) {
    return {
      success: false,
      type: 'error',
      error: error instanceof Error ? error.message : 'Count failed'
    }
  }
}

/**
 * Grouped count: COUNT BY PEN, COUNT ID BY RC
 */
async function executeGroupedCount(
  ast: CommandAST,
  supabase: any
): Promise<ExecutionResult> {
  try {
    const groupField = dairyCompToDb(ast.groupBy!)

    if (!groupField) {
      return {
        success: false,
        type: 'error',
        error: `Unknown field: ${ast.groupBy}`
      }
    }

    // Build conditions for RPC call
    const conditions = buildConditionsJSON(ast.conditions || [])

    // Get tenant_id from user session
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return {
        success: false,
        type: 'error',
        error: 'User not authenticated'
      }
    }

    // Call RPC function
    const { data, error } = await supabase.rpc('count_by_group', {
      p_tenant_id: user.user_metadata.tenant_id,
      p_group_field: groupField,
      p_conditions: conditions
    })

    if (error) {
      return {
        success: false,
        type: 'error',
        error: error.message
      }
    }

    // Format results for display
    const formattedData = (data || []).map((row: any) => ({
      [ast.groupBy!]: formatGroupValue(row.group_value, ast.groupBy!),
      COUNT: row.count
    }))

    // Calculate total
    const total = formattedData.reduce((sum: number, row: any) => sum + (row.COUNT || 0), 0)

    // Add total row
    formattedData.push({
      [ast.groupBy!]: 'TOTAL',
      COUNT: total
    })

    return {
      success: true,
      type: 'count',
      data: formattedData,
      columns: [ast.groupBy!, 'COUNT'],
      count: total
    }
  } catch (error) {
    return {
      success: false,
      type: 'error',
      error: error instanceof Error ? error.message : 'Grouped count failed'
    }
  }
}

/**
 * Build conditions JSON for RPC call
 */
function buildConditionsJSON(conditions: Condition[]): any {
  if (conditions.length === 0) {
    return []
  }

  return conditions.map(condition => {
    const dbField = dairyCompToDb(condition.field)

    if (!dbField) {
      console.warn(`Unknown field: ${condition.field}`)
      return null
    }

    // Note: RC code mapping removed - use reproductive_status directly
    return {
      field: dbField,
      operator: condition.operator,
      value: String(condition.value)
    }
  }).filter(c => c !== null)
}

/**
 * Format group value for display
 */
function formatGroupValue(value: any, field: string): string | number {
  if (value === null || value === 'NULL') {
    return '(empty)'
  }

  // Special formatting for specific fields
  switch (field) {
    case 'RC':
    case 'RPRO':
      // If value is a status string, convert to RC code
      if (typeof value === 'string') {
        const rcCode = statusToRcCode(value)
        return `${rcCode} - ${getRCLabel(rcCode)}`
      }
      return value

    case 'PEN':
      return value

    case 'LACT':
      return parseInt(value)

    default:
      return value
  }
}

/**
 * Get RC label
 */
function getRCLabel(code: number): string {
  const labels: Record<number, string> = {
    0: 'Blank',
    1: 'DNB',
    2: 'Fresh',
    3: 'Open',
    4: 'Bred',
    5: 'Preg',
    6: 'Dry',
    7: 'Sold/Die',
    8: 'Bull Calf'
  }
  return labels[code] || 'Unknown'
}

/**
 * Helper to convert status to RC code (if not already imported)
 */
function statusToRcCode(status: string): number {
  const mapping: Record<string, number> = {
    'blank': 0,
    'dnb': 1,
    'fresh': 2,
    'open': 3,
    'bred': 4,
    'preg': 5,
    'dry': 6,
    'sold': 7,
    'died': 7,
    'bull_calf': 8
  }
  return mapping[status.toLowerCase()] || 0
}
