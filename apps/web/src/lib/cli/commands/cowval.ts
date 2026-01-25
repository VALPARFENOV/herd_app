/**
 * COWVAL Command - Cow valuation analysis
 * Phase 4: Economics Module
 */

import { createClient } from '@/lib/supabase/client'
import type { CommandAST, ExecutionResult } from '../types'
import { dairyCompToDb } from '../field-mapping'
import { buildConditionsJSON } from '../utils'

/**
 * Execute COWVAL command
 */
export async function executeCowval(ast: CommandAST): Promise<ExecutionResult> {
  const supabase = createClient()

  // Get user tenant
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return {
      success: false,
      error: 'Authentication required'
    }
  }

  const tenantId = user.user_metadata?.tenant_id
  if (!tenantId) {
    return {
      success: false,
      error: 'No tenant associated with user'
    }
  }

  // Parse switches to determine variant
  const switches = ast.switches || []
  const variant = switches[0] || 'BASIC'

  switch (variant.toUpperCase()) {
    case 'UPDATE':
    case 'U':
      return await cowvalUpdate(supabase, tenantId)

    case 'SUMMARY':
    case 'S':
      return await cowvalSummary(supabase, tenantId)

    case 'TOP':
    case 'T':
      return await cowvalTop(supabase, tenantId, true)

    case 'BOTTOM':
    case 'B':
      return await cowvalTop(supabase, tenantId, false)

    default:
      return await cowvalReport(supabase, tenantId, ast)
  }
}

/**
 * COWVAL - Basic valuation report with sorting and conditions
 */
async function cowvalReport(
  supabase: any,
  tenantId: string,
  ast: CommandAST
): Promise<ExecutionResult> {
  // Determine sort field (default: RELV - relative value)
  const sortField = ast.sortBy || 'relative_value'
  const sortDesc = true // Default: highest value first

  const { data, error } = await supabase.rpc('get_cowval_report', {
    p_tenant_id: tenantId,
    p_sort_by: sortField,
    p_sort_desc: sortDesc,
    p_limit: 100
  })

  if (error) {
    return {
      success: false,
      error: `Failed to get cow valuations: ${error.message}`
    }
  }

  if (!data || data.length === 0) {
    return {
      success: true,
      type: 'text',
      text: 'No cow valuations available. Run COWVAL\\UPDATE to calculate valuations.'
    }
  }

  // Format the results
  const rows = data.map((row: any) => ({
    ID: row.ear_tag,
    Pen: row.pen_name || '-',
    Lact: row.lactation_number,
    'Total Value': formatCurrency(row.total_value),
    'Relative %': formatDecimal(row.relative_value, 1) + '%',
    'Prod Value': formatCurrency(row.production_value),
    'Preg Value': formatCurrency(row.pregnancy_value),
    'Age Adj': formatDecimal(row.age_adjustment, 3)
  }))

  // Calculate summary
  const avgValue = data.reduce((sum: number, r: any) => sum + parseFloat(r.total_value || 0), 0) / data.length
  const avgRelative = data.reduce((sum: number, r: any) => sum + parseFloat(r.relative_value || 0), 0) / data.length

  return {
    success: true,
    type: 'list',
    data: rows,
    columns: ['ID', 'Pen', 'Lact', 'Total Value', 'Relative %', 'Prod Value', 'Preg Value', 'Age Adj'],
    aggregates: {
      summary: [
        `Total Cows: ${data.length}`,
        `Average Value: ${formatCurrency(avgValue)}`,
        `Average Relative: ${formatDecimal(avgRelative, 1)}%`,
        `Sorted by: ${sortField} (descending)`
      ]
    }
  }
}

/**
 * COWVAL\UPDATE - Update all cow valuations
 */
async function cowvalUpdate(
  supabase: any,
  tenantId: string
): Promise<ExecutionResult> {
  const { data, error } = await supabase.rpc('update_cow_valuations', {
    p_tenant_id: tenantId
  })

  if (error) {
    return {
      success: false,
      error: `Failed to update cow valuations: ${error.message}`
    }
  }

  const cowsUpdated = data || 0

  return {
    success: true,
    type: 'text',
    text: `✓ Successfully updated valuations for ${cowsUpdated} cows`
  }
}

/**
 * COWVAL\SUMMARY - Herd-level valuation statistics
 */
async function cowvalSummary(
  supabase: any,
  tenantId: string
): Promise<ExecutionResult> {
  const { data, error } = await supabase.rpc('get_valuation_summary', {
    p_tenant_id: tenantId
  })

  if (error) {
    return {
      success: false,
      error: `Failed to get valuation summary: ${error.message}`
    }
  }

  if (!data || data.length === 0) {
    return {
      success: true,
      type: 'text',
      text: 'No valuation data available. Run COWVAL\\UPDATE first.'
    }
  }

  const summary = data[0]

  const rows = [
    { Metric: 'Total Cows Valued', Value: summary.total_cows },
    { Metric: 'Average Cow Value', Value: formatCurrency(summary.avg_cow_value) },
    { Metric: 'Median Cow Value', Value: formatCurrency(summary.median_cow_value) },
    { Metric: 'Total Herd Value', Value: formatCurrency(summary.total_herd_value) },
    { Metric: 'Average Relative Value', Value: formatDecimal(summary.avg_relative_value, 1) + '%' },
    { Metric: 'High Value Cows (>100%)', Value: summary.high_value_count },
    { Metric: 'Low Value Cows (<70%)', Value: summary.low_value_count }
  ]

  return {
    success: true,
    type: 'list',
    data: rows,
    columns: ['Metric', 'Value'],
    aggregates: {
      summary: [
        `Total Herd Value: ${formatCurrency(summary.total_herd_value)}`,
        `High Value: ${summary.high_value_count} cows above heifer cost`,
        `Low Value: ${summary.low_value_count} cows below 70% of heifer cost (cull candidates)`
      ]
    }
  }
}

/**
 * COWVAL\TOP or COWVAL\BOTTOM - Top/bottom valued cows
 */
async function cowvalTop(
  supabase: any,
  tenantId: string,
  isTop: boolean
): Promise<ExecutionResult> {
  const { data, error } = await supabase.rpc('get_cowval_report', {
    p_tenant_id: tenantId,
    p_sort_by: 'relative_value',
    p_sort_desc: isTop,
    p_limit: 20
  })

  if (error) {
    return {
      success: false,
      error: `Failed to get cow valuations: ${error.message}`
    }
  }

  if (!data || data.length === 0) {
    return {
      success: true,
      type: 'text',
      text: 'No cow valuations available'
    }
  }

  // Format the results
  const rows = data.map((row: any, index: number) => ({
    Rank: index + 1,
    ID: row.ear_tag,
    Pen: row.pen_name || '-',
    Lact: row.lactation_number,
    'Total Value': formatCurrency(row.total_value),
    'Relative %': formatDecimal(row.relative_value, 1) + '%'
  }))

  return {
    success: true,
    type: 'list',
    data: rows,
    columns: ['Rank', 'ID', 'Pen', 'Lact', 'Total Value', 'Relative %'],
    aggregates: {
      summary: [
        isTop
          ? `Top 20 highest valued cows (by relative value %)`
          : `Bottom 20 lowest valued cows - potential cull candidates`
      ]
    }
  }
}

/**
 * Format currency values
 */
function formatCurrency(value: number | null | undefined): string {
  if (value === null || value === undefined) return '-'
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value)
}

/**
 * Format decimal values
 */
function formatDecimal(value: number | null | undefined, decimals: number = 2): string {
  if (value === null || value === undefined) return '-'
  return parseFloat(value.toString()).toFixed(decimals)
}
