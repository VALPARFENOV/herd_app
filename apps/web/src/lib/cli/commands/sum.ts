/**
 * SUM command implementation
 * Supports:
 * - SUM MILK LACT \A - averages (default)
 * - SUM MILK LACT \T - totals
 * - SUM MILK BY PEN \A - grouped averages
 * - SUM MILK SCC \T BY RC - grouped totals for multiple fields
 */

import { createClient } from '@/lib/supabase/client'
import { CommandAST, Condition } from '../parser-simple'
import { dairyCompToDb } from '../field-mapping'
import { ExecutionResult } from '../executor'

/**
 * Execute SUM command
 */
export async function executeSum(ast: CommandAST): Promise<ExecutionResult> {
  const supabase = createClient()

  try {
    // Determine if we're showing averages (\A) or totals (\T)
    const switches = ast.switches || []
    const showAverages = switches.includes('A') || switches.length === 0 // Default to averages
    const showTotals = switches.includes('T')

    // Fields to aggregate
    const fields = ast.items || ['MILK'] // Default to MILK if no fields specified

    // Validate fields
    const dbFields = fields.map(f => dairyCompToDb(f)).filter(f => f !== null) as string[]

    if (dbFields.length === 0) {
      return {
        success: false,
        type: 'error',
        error: 'No valid fields specified for aggregation'
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
    const { data, error } = await supabase.rpc('calculate_aggregates', {
      p_tenant_id: user.user_metadata.tenant_id,
      p_field: dbFields[0] || '',
      p_fields: dbFields,
      p_conditions: conditions,
      p_group_by: (ast.groupBy ? dairyCompToDb(ast.groupBy) : undefined) || undefined,
      p_include_avg: showAverages,
      p_include_sum: showTotals
    })

    if (error) {
      return {
        success: false,
        type: 'error',
        error: error.message
      }
    }

    // Format results for display
    if (ast.groupBy) {
      // Grouped aggregation
      return formatGroupedAggregates(data, ast, fields, showAverages, showTotals)
    } else {
      // Simple aggregation (single row)
      return formatSimpleAggregates(data, fields, showAverages, showTotals)
    }
  } catch (error) {
    return {
      success: false,
      type: 'error',
      error: error instanceof Error ? error.message : 'SUM execution failed'
    }
  }
}

/**
 * Format simple (non-grouped) aggregates
 */
function formatSimpleAggregates(
  data: any,
  fields: string[],
  showAverages: boolean,
  showTotals: boolean
): ExecutionResult {
  const resultData: Record<string, any>[] = []

  // Parse JSONB result
  const aggregates = typeof data === 'string' ? JSON.parse(data) : data

  for (const field of fields) {
    const dbField = dairyCompToDb(field)!
    const row: Record<string, any> = {
      FIELD: field
    }

    if (showAverages) {
      row.AVG = aggregates[`avg_${dbField}`] || 0
    }

    if (showTotals) {
      row.SUM = aggregates[`sum_${dbField}`] || 0
    }

    row.COUNT = aggregates[`count_${dbField}`] || 0

    resultData.push(row)
  }

  // Build columns
  const columns = ['FIELD']
  if (showAverages) columns.push('AVG')
  if (showTotals) columns.push('SUM')
  columns.push('COUNT')

  return {
    success: true,
    type: 'sum',
    data: resultData,
    columns,
    aggregates
  }
}

/**
 * Format grouped aggregates
 */
function formatGroupedAggregates(
  data: any,
  ast: CommandAST,
  fields: string[],
  showAverages: boolean,
  showTotals: boolean
): ExecutionResult {
  // Parse JSONB result if needed
  const groups = Array.isArray(data) ? data : (typeof data === 'string' ? JSON.parse(data) : [data])

  const resultData: Record<string, any>[] = []

  for (const group of groups) {
    const row: Record<string, any> = {
      [ast.groupBy!]: formatGroupValue(group.group, ast.groupBy!)
    }

    // Add aggregates for each field
    for (const field of fields) {
      const dbField = dairyCompToDb(field)!

      if (showAverages) {
        row[`${field}_AVG`] = group[`avg_${dbField}`] || 0
      }

      if (showTotals) {
        row[`${field}_SUM`] = group[`sum_${dbField}`] || 0
      }
    }

    // Add total count (use first field's count)
    const firstDbField = dairyCompToDb(fields[0])!
    row.COUNT = group[`count_${firstDbField}`] || 0

    resultData.push(row)
  }

  // Build columns
  const columns = [ast.groupBy!]

  for (const field of fields) {
    if (showAverages) columns.push(`${field}_AVG`)
    if (showTotals) columns.push(`${field}_SUM`)
  }

  columns.push('COUNT')

  return {
    success: true,
    type: 'sum',
    data: resultData,
    columns,
    aggregates: groups
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

    // Special handling for RC field - convert numeric code to status string
    let value = condition.value
    if ((condition.field === 'RC' || condition.field === 'RPRO') && typeof value === 'number') {
      // RC code mapping removed
    }

    return {
      field: dbField,
      operator: condition.operator,
      value: String(value)
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
