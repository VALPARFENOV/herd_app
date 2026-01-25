/**
 * PLOT command implementation - Production charting and lactation curves
 * Supports plotting production data over DIM, time, or by groups
 */

import { createClient } from '@/lib/supabase/client'
import { CommandAST } from '../parser-simple'
import { ExecutionResult } from '../executor'

/**
 * Execute PLOT command
 *
 * Variants:
 * - PLOT MILK BY DIM - Lactation curves
 * - PLOT MILK BY TDAT - Time series
 * - PLOT 305ME BY LACT - Group comparison
 * - PLOT MILK BY PEN - Location comparison
 */
export async function executePlot(ast: CommandAST): Promise<ExecutionResult> {
  const supabase = createClient()

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
    const groupBy = ast.groupBy?.toUpperCase()
    const fields = ast.items || ['MILK'] // Default to MILK if no field specified

    // Determine which plot variant based on groupBy clause
    switch (groupBy) {
      case 'DIM':
        return await plotByDIM(supabase, tenantId, fields)

      case 'TDAT':
      case 'DATE':
        return await plotByDate(supabase, tenantId, fields)

      case 'LACT':
      case 'LACTATION':
        return await plotByLactation(supabase, tenantId, fields)

      case 'PEN':
        return await plotByPen(supabase, tenantId, fields)

      default:
        // Default to DIM if no groupBy specified
        return await plotByDIM(supabase, tenantId, fields)
    }

  } catch (error) {
    return {
      success: false,
      type: 'error',
      error: error instanceof Error ? error.message : 'PLOT execution failed'
    }
  }
}

/**
 * PLOT BY DIM - Lactation curves
 * Example: PLOT MILK BY DIM
 */
async function plotByDIM(
  supabase: any,
  tenantId: string,
  fields: string[]
): Promise<ExecutionResult> {
  const field = fields[0] || 'MILK'

  const { data, error } = await supabase.rpc('plot_by_dim', {
    p_tenant_id: tenantId,
    p_field: field,
    p_max_dim: 305
  })

  if (error) {
    return { success: false, type: 'error', error: error.message }
  }

  // Group data by animal for multi-line chart
  const animalGroups = new Map<string, any[]>()

  for (const row of data || []) {
    const key = `${row.ear_tag} (L${row.lactation_number})`
    if (!animalGroups.has(key)) {
      animalGroups.set(key, [])
    }
    animalGroups.get(key)!.push({
      dim: row.dim_at_test,
      value: parseFloat(row.value),
      date: row.test_date
    })
  }

  // Convert to chart-friendly format
  const chartData: any = {
    type: 'line-chart',
    title: `${field} Lactation Curve`,
    xAxis: 'DIM (Days in Milk)',
    yAxis: field,
    series: Array.from(animalGroups.entries()).map(([name, points]) => ({
      name,
      data: points.sort((a, b) => a.dim - b.dim)
    }))
  }

  return {
    success: true,
    type: 'list', // Will be 'chart' when chart rendering implemented
    data: data || [],
    columns: ['Ear Tag', 'Lactation', 'DIM', field, 'Test Date'],
    // Store chart config for future use
    aggregates: chartData
  }
}

/**
 * PLOT BY TDAT - Time series
 * Example: PLOT MILK BY TDAT
 */
async function plotByDate(
  supabase: any,
  tenantId: string,
  fields: string[]
): Promise<ExecutionResult> {
  const field = fields[0] || 'MILK'

  // Calculate date range (last 365 days by default)
  const endDate = new Date()
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - 365)

  const { data, error } = await supabase.rpc('plot_by_date', {
    p_tenant_id: tenantId,
    p_field: field,
    p_start_date: startDate.toISOString().split('T')[0],
    p_end_date: endDate.toISOString().split('T')[0],
    p_aggregate: true // Herd average
  })

  if (error) {
    return { success: false, type: 'error', error: error.message }
  }

  const chartData: any = {
    type: 'line-chart',
    title: `${field} Over Time`,
    xAxis: 'Date',
    yAxis: field,
    series: [{
      name: 'Herd Average',
      data: (data || []).map((row: any) => ({
        date: row.test_date,
        value: parseFloat(row.value),
        count: row.animal_count
      }))
    }]
  }

  return {
    success: true,
    type: 'list',
    data: data || [],
    columns: ['Test Date', field, 'Animal Count'],
    aggregates: chartData
  }
}

/**
 * PLOT BY LACT - Group comparison
 * Example: PLOT 305ME BY LACT
 */
async function plotByLactation(
  supabase: any,
  tenantId: string,
  fields: string[]
): Promise<ExecutionResult> {
  const field = fields[0] || '305ME'

  const { data, error } = await supabase.rpc('plot_by_lactation', {
    p_tenant_id: tenantId,
    p_field: field,
    p_metric: 'avg'
  })

  if (error) {
    return { success: false, type: 'error', error: error.message }
  }

  const chartData: any = {
    type: 'bar-chart',
    title: `Average ${field} by Lactation`,
    xAxis: 'Lactation Group',
    yAxis: `Average ${field}`,
    series: [{
      name: field,
      data: (data || []).map((row: any) => ({
        category: row.lactation_group,
        value: parseFloat(row.value),
        count: row.animal_count
      }))
    }]
  }

  return {
    success: true,
    type: 'list',
    data: data || [],
    columns: ['Lactation Group', `Avg ${field}`, 'Count'],
    aggregates: chartData
  }
}

/**
 * PLOT BY PEN - Location comparison
 * Example: PLOT MILK BY PEN
 */
async function plotByPen(
  supabase: any,
  tenantId: string,
  fields: string[]
): Promise<ExecutionResult> {
  const field = fields[0] || 'MILK'

  const { data, error } = await supabase.rpc('plot_by_pen', {
    p_tenant_id: tenantId,
    p_field: field,
    p_metric: 'avg'
  })

  if (error) {
    return { success: false, type: 'error', error: error.message }
  }

  const chartData: any = {
    type: 'bar-chart',
    title: `Average ${field} by Pen`,
    xAxis: 'Pen',
    yAxis: `Average ${field}`,
    series: [{
      name: field,
      data: (data || []).map((row: any) => ({
        category: row.pen_name,
        value: parseFloat(row.value),
        count: row.animal_count
      }))
    }]
  }

  return {
    success: true,
    type: 'list',
    data: data || [],
    columns: ['Pen', `Avg ${field}`, 'Count'],
    aggregates: chartData
  }
}
