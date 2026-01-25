/**
 * BREDSUM command implementation - Breeding performance analysis
 * Supports 12 variants via switches
 */

import { createClient } from '@/lib/supabase/client'
import { CommandAST } from '../parser-simple'
import { ExecutionResult } from '../executor'

/**
 * Execute BREDSUM command with variant support
 */
export async function executeBredsum(ast: CommandAST): Promise<ExecutionResult> {
  const supabase = createClient()
  const switches = ast.switches || []
  const variant = switches[0] || 'BASIC'

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

    // Dispatch to appropriate variant
    switch (variant) {
      case 'B':
        return await bredsumByService(supabase, tenantId)

      case 'C':
        return await bredsumByMonth(supabase, tenantId)

      case 'T':
        return await bredsumByTechnician(supabase, tenantId)

      case 'S':
        return await bredsumBySire(supabase, tenantId)

      case 'P':
        return await bredsumByPen(supabase, tenantId)

      case 'E':
        return await bredsum21Day(supabase, tenantId)

      case 'H':
        return await bredsumHeatDetection(supabase, tenantId)

      case 'Q':
        return await bredsumQSum(supabase, tenantId)

      case 'N':
        return await bredsumByDIM(supabase, tenantId)

      case 'W':
        return await bredsumByDayOfWeek(supabase, tenantId)

      case 'PG':
        // Prostaglandin protocols - placeholder
        return {
          success: false,
          type: 'error',
          error: 'BREDSUM \\PG not yet implemented'
        }

      default: // 'BASIC'
        return await bredsumBasic(supabase, tenantId)
    }
  } catch (error) {
    return {
      success: false,
      type: 'error',
      error: error instanceof Error ? error.message : 'BREDSUM execution failed'
    }
  }
}

/**
 * Basic BREDSUM - by lactation group
 */
async function bredsumBasic(supabase: any, tenantId: string): Promise<ExecutionResult> {
  const { data, error } = await supabase.rpc('calculate_bredsum_basic', {
    p_tenant_id: tenantId
  })

  if (error) {
    return { success: false, type: 'error', error: error.message }
  }

  return {
    success: true,
    type: 'list',
    data: data || [],
    columns: ['Lactation', 'Breedings', 'Preg', 'CR%', 'SPC', 'Avg DIM']
  }
}

/**
 * BREDSUM \B - by service number
 */
async function bredsumByService(supabase: any, tenantId: string): Promise<ExecutionResult> {
  const { data, error } = await supabase.rpc('calculate_bredsum_by_service', {
    p_tenant_id: tenantId
  })

  if (error) {
    return { success: false, type: 'error', error: error.message }
  }

  return {
    success: true,
    type: 'list',
    data: data || [],
    columns: ['Service #', 'Breedings', 'Preg', 'CR%']
  }
}

/**
 * BREDSUM \C - by calendar month
 */
async function bredsumByMonth(supabase: any, tenantId: string): Promise<ExecutionResult> {
  const { data, error } = await supabase.rpc('calculate_bredsum_by_month', {
    p_tenant_id: tenantId
  })

  if (error) {
    return { success: false, type: 'error', error: error.message }
  }

  return {
    success: true,
    type: 'list',
    data: data || [],
    columns: ['Month', 'Breedings', 'Preg', 'CR%']
  }
}

/**
 * BREDSUM \T - by technician
 */
async function bredsumByTechnician(supabase: any, tenantId: string): Promise<ExecutionResult> {
  const { data, error } = await supabase.rpc('calculate_bredsum_by_technician', {
    p_tenant_id: tenantId
  })

  if (error) {
    return { success: false, type: 'error', error: error.message }
  }

  return {
    success: true,
    type: 'list',
    data: data || [],
    columns: ['Technician', 'Breedings', 'Preg', 'CR%', 'SPC']
  }
}

/**
 * BREDSUM \S - by sire
 */
async function bredsumBySire(supabase: any, tenantId: string): Promise<ExecutionResult> {
  const { data, error } = await supabase.rpc('calculate_bredsum_by_sire', {
    p_tenant_id: tenantId
  })

  if (error) {
    return { success: false, type: 'error', error: error.message }
  }

  return {
    success: true,
    type: 'list',
    data: data || [],
    columns: ['Bull Name', 'Bull ID', 'Breedings', 'Preg', 'CR%', 'SPC']
  }
}

/**
 * BREDSUM \P - by pen
 */
async function bredsumByPen(supabase: any, tenantId: string): Promise<ExecutionResult> {
  const { data, error } = await supabase.rpc('calculate_bredsum_by_pen', {
    p_tenant_id: tenantId
  })

  if (error) {
    return { success: false, type: 'error', error: error.message }
  }

  return {
    success: true,
    type: 'list',
    data: data || [],
    columns: ['Pen', 'Breedings', 'Preg', 'CR%', 'SPC']
  }
}

/**
 * BREDSUM \E - 21-day pregnancy rates
 */
async function bredsum21Day(supabase: any, tenantId: string): Promise<ExecutionResult> {
  const { data, error } = await supabase.rpc('calculate_bredsum_21day', {
    p_tenant_id: tenantId
  })

  if (error) {
    return { success: false, type: 'error', error: error.message }
  }

  return {
    success: true,
    type: 'list',
    data: data || [],
    columns: ['Period Start', 'Eligible', 'Breedings', 'Preg', 'PR%', 'HDR%']
  }
}

/**
 * BREDSUM \H - heat detection
 */
async function bredsumHeatDetection(supabase: any, tenantId: string): Promise<ExecutionResult> {
  const { data, error } = await supabase.rpc('calculate_bredsum_heat_detection', {
    p_tenant_id: tenantId
  })

  if (error) {
    return { success: false, type: 'error', error: error.message }
  }

  return {
    success: true,
    type: 'list',
    data: data || [],
    columns: ['Metric', 'Value', 'Count']
  }
}

/**
 * BREDSUM \Q - Q-Sum cumulative conception rate
 */
async function bredsumQSum(supabase: any, tenantId: string): Promise<ExecutionResult> {
  const { data, error } = await supabase.rpc('calculate_bredsum_qsum', {
    p_tenant_id: tenantId
  })

  if (error) {
    return { success: false, type: 'error', error: error.message }
  }

  // Return as chart data for visualization
  return {
    success: true,
    type: 'list', // Will be 'chart' when chart support added
    data: data || [],
    columns: ['Day #', 'Date', 'Daily Breed', 'Daily Preg', 'Cum Breed', 'Cum Preg', 'Cum CR%']
  }
}

/**
 * BREDSUM \N - by DIM range
 */
async function bredsumByDIM(supabase: any, tenantId: string): Promise<ExecutionResult> {
  const { data, error } = await supabase.rpc('calculate_bredsum_by_dim', {
    p_tenant_id: tenantId
  })

  if (error) {
    return { success: false, type: 'error', error: error.message }
  }

  return {
    success: true,
    type: 'list',
    data: data || [],
    columns: ['DIM Range', 'Breedings', 'Preg', 'CR%']
  }
}

/**
 * BREDSUM \W - by day of week
 */
async function bredsumByDayOfWeek(supabase: any, tenantId: string): Promise<ExecutionResult> {
  const { data, error } = await supabase.rpc('calculate_bredsum_by_dow', {
    p_tenant_id: tenantId
  })

  if (error) {
    return { success: false, type: 'error', error: error.message }
  }

  return {
    success: true,
    type: 'list',
    data: data || [],
    columns: ['Day of Week', 'Breedings', 'Preg', 'CR%']
  }
}
