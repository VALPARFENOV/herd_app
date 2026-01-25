/**
 * Command executor for DairyComp commands
 * Converts parsed AST to Supabase queries and executes them
 */

import { createClient } from '@/lib/supabase/client'
import { CommandAST, Condition } from './parser-simple'
import { dairyCompToDb, dbToDairyComp } from './field-mapping'
import { rcCodeToStatus, statusToRcCode } from './rc-code-mapping'
import { executeCount } from './commands/count'
import { executeSum } from './commands/sum'

export interface ExecutionResult {
  success: boolean
  type: 'list' | 'count' | 'sum' | 'error'
  data?: any[]
  columns?: string[]
  count?: number
  aggregates?: Record<string, any>
  error?: string
  executionTime?: number
}

/**
 * Execute a parsed command
 */
export async function executeCommand(ast: CommandAST): Promise<ExecutionResult> {
  const startTime = performance.now()

  try {
    let result: ExecutionResult

    switch (ast.command) {
      case 'LIST':
      case 'SHOW':
        result = await executeList(ast)
        break

      case 'COUNT':
        result = await executeCount(ast)
        break

      case 'SUM':
        result = await executeSum(ast)
        break

      default:
        result = {
          success: false,
          type: 'error',
          error: `Command ${ast.command} not yet implemented`
        }
    }

    const executionTime = performance.now() - startTime
    return {
      ...result,
      executionTime: Math.round(executionTime)
    }

  } catch (error) {
    return {
      success: false,
      type: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
      executionTime: Math.round(performance.now() - startTime)
    }
  }
}

/**
 * Execute LIST command
 */
async function executeList(ast: CommandAST): Promise<ExecutionResult> {
  const supabase = createClient()

  try {
    // Determine which fields to select
    const selectFields = getSelectFields(ast.items)

    // Build query - use animals_with_calculated view for DIM and other calculated fields
    let query = supabase
      .from('animals_with_calculated')
      .select(selectFields, { count: 'exact' })

    // Apply conditions (WHERE clause)
    if (ast.conditions && ast.conditions.length > 0) {
      query = applyConditions(query, ast.conditions)
    }

    // Apply sorting
    if (ast.sortBy) {
      const dbField = dairyCompToDb(ast.sortBy.field)
      if (dbField) {
        query = query.order(dbField, { ascending: !ast.sortBy.descending })
      }
    }

    // Execute query
    const { data, error, count } = await query

    if (error) {
      return {
        success: false,
        type: 'error',
        error: error.message
      }
    }

    // Map database fields back to DairyComp codes for display
    const columns = ast.items || getDefaultListColumns()

    return {
      success: true,
      type: 'list',
      data: data || [],
      columns,
      count: count || 0
    }

  } catch (error) {
    return {
      success: false,
      type: 'error',
      error: error instanceof Error ? error.message : 'Query execution failed'
    }
  }
}

/**
 * Get fields to select based on items
 */
function getSelectFields(items?: string[]): string {
  if (!items || items.length === 0) {
    // Default columns for LIST
    return 'ear_tag,pen_id,lactation_number,dim,reproductive_status,last_milk_kg'
  }

  const dbFields: string[] = []

  for (const item of items) {
    const dbField = dairyCompToDb(item)
    if (dbField) {
      dbFields.push(dbField)
    }
  }

  // Always include ear_tag for identification
  if (!dbFields.includes('ear_tag')) {
    dbFields.unshift('ear_tag')
  }

  return dbFields.join(',')
}

/**
 * Apply conditions to query
 */
function applyConditions(query: any, conditions: Condition[]): any {
  for (const condition of conditions) {
    const dbField = dairyCompToDb(condition.field)

    if (!dbField) {
      console.warn(`Unknown field: ${condition.field}`)
      continue
    }

    // Special handling for RC field - convert numeric code to status string
    let value = condition.value
    if ((condition.field === 'RC' || condition.field === 'RPRO') && typeof value === 'number') {
      value = rcCodeToStatus(value)
    }

    switch (condition.operator) {
      case '=':
        query = query.eq(dbField, value)
        break
      case '>':
        query = query.gt(dbField, value)
        break
      case '<':
        query = query.lt(dbField, value)
        break
      case '>=':
        query = query.gte(dbField, value)
        break
      case '<=':
        query = query.lte(dbField, value)
        break
      case '<>':
        query = query.neq(dbField, value)
        break
    }
  }

  return query
}

/**
 * Get default columns for LIST command
 */
function getDefaultListColumns(): string[] {
  return ['ID', 'PEN', 'LACT', 'DIM', 'RC', 'MILK']
}

/**
 * Format result data for display
 * Converts database values to user-friendly format
 */
export function formatResultData(
  data: any[],
  columns: string[]
): Array<Record<string, string | number>> {
  return data.map(row => {
    const formatted: Record<string, string | number> = {}

    for (const column of columns) {
      const dbField = dairyCompToDb(column)
      if (dbField && row[dbField] !== undefined) {
        formatted[column] = formatValue(row[dbField], column)
      } else {
        formatted[column] = ''
      }
    }

    return formatted
  })
}

/**
 * Format a single value based on its type
 */
function formatValue(value: any, itemCode: string): string | number {
  if (value === null || value === undefined) {
    return ''
  }

  // Special formatting for specific fields
  switch (itemCode) {
    case 'RC':
    case 'RPRO':
      // Convert reproductive_status string to RC numeric code
      if (typeof value === 'string') {
        return statusToRcCode(value)
      }
      return value

    case 'DIM':
    case 'DCC':
    case 'DOPN':
    case 'AGE':
    case 'LACT':
    case 'TBRD':
      // Numbers without decimals
      return Math.round(value)

    case 'MILK':
    case 'SCC':
    case 'PCTF':
    case 'PCTP':
      // Numbers with 1 decimal
      return typeof value === 'number' ? Math.round(value * 10) / 10 : value

    case 'BDAT':
    case 'FDAT':
    case 'CDAT':
    case 'DDAT':
    case 'HDAT':
      // Dates - format as YYYY-MM-DD
      if (value instanceof Date) {
        return value.toISOString().split('T')[0]
      }
      return value

    default:
      return value
  }
}
