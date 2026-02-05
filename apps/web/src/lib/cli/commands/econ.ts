/**
 * ECON Command - Economic analysis and IOFC tracking
 * Phase 4: Economics Module
 */

import { createClient } from '@/lib/supabase/client'
import type { CommandAST } from '../parser-simple'
import type { ExecutionResult } from '../executor'

/**
 * Execute ECON command with variants
 */
export async function executeEcon(ast: CommandAST): Promise<ExecutionResult> {
  const supabase = createClient()

  // Get user tenant
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return {
      success: false,
      type: 'error' as const,
      error: 'Authentication required'
    }
  }

  const tenantId = user.user_metadata?.tenant_id
  if (!tenantId) {
    return {
      success: false,
      type: 'error' as const,
      error: 'No tenant associated with user'
    }
  }

  // Parse switches to determine variant
  const switches = ast.switches || []
  const variant = switches[0] || 'BASIC'

  // Determine date range (default: last 30 days)
  const endDate = new Date()
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - 30)

  switch (variant.toUpperCase()) {
    case 'PEN':
      return await econByPen(supabase, tenantId, startDate, endDate)

    case 'TREND':
    case 'T':
      return await econTrends(supabase, tenantId, startDate, endDate)

    case 'COSTS':
    case 'C':
      return await econCostBreakdown(supabase, tenantId, startDate, endDate)

    default:
      return await econBasic(supabase, tenantId, startDate, endDate)
  }
}

/**
 * ECON - Basic economic summary
 */
async function econBasic(
  supabase: any,
  tenantId: string,
  startDate: Date,
  endDate: Date
): Promise<ExecutionResult> {
  const { data, error } = await supabase.rpc('calculate_economics', {
    p_tenant_id: tenantId,
    p_start_date: startDate.toISOString().split('T')[0],
    p_end_date: endDate.toISOString().split('T')[0]
  })

  if (error) {
    return {
      success: false,
      type: 'error' as const,
      error: `Failed to calculate economics: ${error.message}`
    }
  }

  if (!data || data.length === 0) {
    return {
      success: true,
      type: 'text' as const,
      text: 'No economic data available for the selected period'
    }
  }

  // Format the results
  const rows = data.map((row: any) => ({
    Metric: row.metric,
    Total: formatCurrency(row.value),
    'Per Cow': formatCurrency(row.per_cow),
    Period: `${row.period_days} days`
  }))

  // Calculate summary metrics
  const revenue = data.find((r: any) => r.metric === 'Total Milk Revenue')
  const feedCosts = data.find((r: any) => r.metric === 'Total Feed Costs')
  const iofc = data.find((r: any) => r.metric === 'IOFC (Income Over Feed Cost)')

  return {
    success: true,
    type: 'list',
    data: rows,
    columns: ['Metric', 'Total', 'Per Cow', 'Period'],
    aggregates: {
      summary: [
        `Period: ${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`,
        `Total Revenue: ${formatCurrency(revenue?.value || 0)}`,
        `Feed Costs: ${formatCurrency(feedCosts?.value || 0)}`,
        `IOFC: ${formatCurrency(iofc?.value || 0)}`,
        `IOFC per Cow: ${formatCurrency(iofc?.per_cow || 0)}`
      ]
    }
  }
}

/**
 * ECON\PEN - Economic analysis by pen
 */
async function econByPen(
  supabase: any,
  tenantId: string,
  startDate: Date,
  endDate: Date
): Promise<ExecutionResult> {
  const { data, error } = await supabase.rpc('calculate_iofc_by_pen', {
    p_tenant_id: tenantId,
    p_start_date: startDate.toISOString().split('T')[0],
    p_end_date: endDate.toISOString().split('T')[0]
  })

  if (error) {
    return {
      success: false,
      type: 'error' as const,
      error: `Failed to calculate IOFC by pen: ${error.message}`
    }
  }

  if (!data || data.length === 0) {
    return {
      success: true,
      type: 'text' as const,
      text: 'No pen-level economic data available'
    }
  }

  // Format the results
  const rows = data.map((row: any) => ({
    Pen: row.pen_name,
    Cows: row.cow_count,
    'Avg Milk': formatDecimal(row.avg_milk_kg, 1),
    Revenue: formatCurrency(row.milk_revenue),
    'Feed Cost': formatCurrency(row.feed_costs),
    IOFC: formatCurrency(row.iofc),
    'IOFC/Cow': formatCurrency(row.iofc_per_cow)
  }))

  // Calculate totals
  const totalCows = data.reduce((sum: number, row: any) => sum + row.cow_count, 0)
  const totalRevenue = data.reduce((sum: number, row: any) => sum + parseFloat(row.milk_revenue || 0), 0)
  const totalIOFC = data.reduce((sum: number, row: any) => sum + parseFloat(row.iofc || 0), 0)

  return {
    success: true,
    type: 'list',
    data: rows,
    columns: ['Pen', 'Cows', 'Avg Milk', 'Revenue', 'Feed Cost', 'IOFC', 'IOFC/Cow'],
    aggregates: {
      summary: [
        `Total Cows: ${totalCows}`,
        `Total Revenue: ${formatCurrency(totalRevenue)}`,
        `Total IOFC: ${formatCurrency(totalIOFC)}`,
        `Avg IOFC/Cow: ${formatCurrency(totalIOFC / totalCows)}`
      ]
    }
  }
}

/**
 * ECON\TREND - Profitability trends
 */
async function econTrends(
  supabase: any,
  tenantId: string,
  startDate: Date,
  endDate: Date
): Promise<ExecutionResult> {
  // Default to weekly trends for 90 days
  const trendStartDate = new Date()
  trendStartDate.setDate(trendStartDate.getDate() - 90)

  const { data, error } = await supabase.rpc('calculate_profitability_trends', {
    p_tenant_id: tenantId,
    p_start_date: trendStartDate.toISOString().split('T')[0],
    p_end_date: endDate.toISOString().split('T')[0],
    p_interval: 'week'
  })

  if (error) {
    return {
      success: false,
      type: 'error' as const,
      error: `Failed to calculate profitability trends: ${error.message}`
    }
  }

  if (!data || data.length === 0) {
    return {
      success: true,
      type: 'text' as const,
      text: 'No trend data available'
    }
  }

  // Format the results
  const rows = data.map((row: any) => ({
    Week: row.period_label,
    Revenue: formatCurrency(row.milk_revenue),
    Costs: formatCurrency(row.total_costs),
    IOFC: formatCurrency(row.iofc),
    Profit: formatCurrency(row.net_profit),
    'Volume (kg)': formatDecimal(row.volume_kg, 0)
  }))

  return {
    success: true,
    type: 'list',
    data: rows,
    columns: ['Week', 'Revenue', 'Costs', 'IOFC', 'Profit', 'Volume (kg)'],
    aggregates: {
      type: 'line-chart',
      title: 'Profitability Trends (Weekly)',
      xAxis: 'Week',
      yAxis: 'Value',
      series: [
        {
          name: 'Revenue',
          data: data.map((r: any) => ({
            x: r.period_label,
            y: parseFloat(r.milk_revenue || 0)
          }))
        },
        {
          name: 'IOFC',
          data: data.map((r: any) => ({
            x: r.period_label,
            y: parseFloat(r.iofc || 0)
          }))
        },
        {
          name: 'Net Profit',
          data: data.map((r: any) => ({
            x: r.period_label,
            y: parseFloat(r.net_profit || 0)
          }))
        }
      ]
    }
  }
}

/**
 * ECON\COSTS - Cost breakdown by type
 */
async function econCostBreakdown(
  supabase: any,
  tenantId: string,
  startDate: Date,
  endDate: Date
): Promise<ExecutionResult> {
  const { data, error } = await supabase.rpc('get_cost_breakdown', {
    p_tenant_id: tenantId,
    p_start_date: startDate.toISOString().split('T')[0],
    p_end_date: endDate.toISOString().split('T')[0]
  })

  if (error) {
    return {
      success: false,
      type: 'error' as const,
      error: `Failed to get cost breakdown: ${error.message}`
    }
  }

  if (!data || data.length === 0) {
    return {
      success: true,
      type: 'text' as const,
      text: 'No cost entries found for the selected period'
    }
  }

  // Format the results
  const rows = data.map((row: any) => ({
    Type: row.cost_type.charAt(0).toUpperCase() + row.cost_type.slice(1),
    Category: row.category || 'General',
    Amount: formatCurrency(row.total_amount),
    Entries: row.entry_count,
    'Percentage': formatDecimal(row.percentage, 1) + '%'
  }))

  // Calculate total
  const totalCosts = data.reduce((sum: number, row: any) => sum + parseFloat(row.total_amount || 0), 0)

  return {
    success: true,
    type: 'list',
    data: rows,
    columns: ['Type', 'Category', 'Amount', 'Entries', 'Percentage'],
    aggregates: {
      summary: [
        `Period: ${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`,
        `Total Costs: ${formatCurrency(totalCosts)}`,
        `Total Entries: ${data.reduce((sum: number, r: any) => sum + r.entry_count, 0)}`
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
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value)
}

/**
 * Format decimal values
 */
function formatDecimal(value: number | null | undefined, decimals: number = 2): string {
  if (value === null || value === undefined) return '-'
  return parseFloat(value.toString()).toFixed(decimals)
}
