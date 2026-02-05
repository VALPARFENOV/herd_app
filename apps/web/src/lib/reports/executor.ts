/**
 * Custom Report Executor
 * Executes report templates against animals_with_calculated view
 * Phase 4: Custom Report Builder
 */

import { createClient } from '@/lib/supabase/client'
import { dairyCompToDb } from '../cli/field-mapping'

export interface ReportTemplate {
  id?: string
  tenant_id?: string
  name: string
  description?: string
  category?: string
  template_data: ReportTemplateData
  is_public?: boolean
  is_system?: boolean
}

export interface ReportTemplateData {
  fields: string[] // DairyComp codes
  filters?: FilterRule[]
  groupBy?: string[]
  sortBy?: SortRule[]
  calculations?: CustomCalculation[]
  visualization?: VisualizationConfig
}

export interface FilterRule {
  field: string // DairyComp code
  operator: '=' | '>' | '<' | '>=' | '<=' | '<>' | 'IN' | 'BETWEEN'
  value: any
  logicalOperator?: 'AND' | 'OR'
}

export interface SortRule {
  field: string
  direction: 'asc' | 'desc'
}

export interface CustomCalculation {
  name: string
  formula: string // e.g., "AVG(MILK)", "SUM(TOTM)"
  description?: string
}

export interface VisualizationConfig {
  type: 'table' | 'chart' | 'both'
  chartType?: 'line' | 'bar' | 'pie' | 'scatter'
  chartConfig?: any
}

export interface ReportResult {
  success: boolean
  data?: any[]
  columns?: string[]
  rowCount?: number
  executionTime?: number
  error?: string
  visualization?: VisualizationConfig
}

/**
 * Execute a report template
 */
export async function executeReportTemplate(
  template: ReportTemplate | ReportTemplateData
): Promise<ReportResult> {
  const startTime = performance.now()

  try {
    const supabase = createClient()

    // Get template data
    const templateData = 'template_data' in template ? template.template_data : template

    // Get user tenant
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return {
        success: false,
        error: 'Authentication required'
      }
    }

    // Build query
    const selectFields = buildSelectFields(templateData.fields)
    let query = supabase
      .from('animals_with_calculated')
      .select(selectFields, { count: 'exact' })

    // Apply filters
    if (templateData.filters && templateData.filters.length > 0) {
      query = applyFilters(query, templateData.filters)
    }

    // Apply sorting
    if (templateData.sortBy && templateData.sortBy.length > 0) {
      for (const sort of templateData.sortBy) {
        const dbField = dairyCompToDb(sort.field)
        if (dbField) {
          query = query.order(dbField, { ascending: sort.direction === 'asc' })
        }
      }
    }

    // Execute query
    const { data, error, count } = await query

    if (error) {
      return {
        success: false,
        error: error.message
      }
    }

    // Apply grouping if specified
    let resultData = data || []
    if (templateData.groupBy && templateData.groupBy.length > 0) {
      resultData = applyGrouping(resultData, templateData.groupBy, templateData.calculations)
    }

    // Apply custom calculations if specified
    if (templateData.calculations && templateData.calculations.length > 0 && !templateData.groupBy) {
      resultData = applyCalculations(resultData, templateData.calculations)
    }

    const executionTime = performance.now() - startTime

    return {
      success: true,
      data: resultData,
      columns: templateData.fields,
      rowCount: count || resultData.length,
      executionTime: Math.round(executionTime),
      visualization: templateData.visualization
    }

  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Report execution failed',
      executionTime: Math.round(performance.now() - startTime)
    }
  }
}

/**
 * Build SELECT field list from DairyComp codes
 */
function buildSelectFields(fields: string[]): string {
  const dbFields: string[] = []

  for (const field of fields) {
    const dbField = dairyCompToDb(field)
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
 * Apply filters to Supabase query
 */
function applyFilters(query: any, filters: FilterRule[]): any {
  for (const filter of filters) {
    const dbField = dairyCompToDb(filter.field)

    if (!dbField) {
      console.warn(`Unknown field: ${filter.field}`)
      continue
    }

    switch (filter.operator) {
      case '=':
        query = query.eq(dbField, filter.value)
        break
      case '>':
        query = query.gt(dbField, filter.value)
        break
      case '<':
        query = query.lt(dbField, filter.value)
        break
      case '>=':
        query = query.gte(dbField, filter.value)
        break
      case '<=':
        query = query.lte(dbField, filter.value)
        break
      case '<>':
        query = query.neq(dbField, filter.value)
        break
      case 'IN':
        if (Array.isArray(filter.value)) {
          query = query.in(dbField, filter.value)
        }
        break
      case 'BETWEEN':
        if (Array.isArray(filter.value) && filter.value.length === 2) {
          query = query.gte(dbField, filter.value[0]).lte(dbField, filter.value[1])
        }
        break
    }
  }

  return query
}

/**
 * Apply grouping and aggregation to result data
 */
function applyGrouping(
  data: any[],
  groupByFields: string[],
  calculations?: CustomCalculation[]
): any[] {
  if (data.length === 0) return []

  // Convert groupBy fields to database field names
  const groupByDbFields = groupByFields
    .map(field => dairyCompToDb(field))
    .filter(Boolean) as string[]

  if (groupByDbFields.length === 0) return data

  // Group data
  const groups = new Map<string, any[]>()

  for (const row of data) {
    // Create group key from groupBy field values
    const groupKey = groupByDbFields.map(field => row[field] || 'NULL').join('|')

    if (!groups.has(groupKey)) {
      groups.set(groupKey, [])
    }
    groups.get(groupKey)!.push(row)
  }

  // Apply aggregations
  const result: any[] = []

  for (const [groupKey, rows] of groups.entries()) {
    const groupValues = groupKey.split('|')
    const groupRow: any = {}

    // Add group field values
    groupByDbFields.forEach((field, index) => {
      groupRow[field] = groupValues[index] !== 'NULL' ? groupValues[index] : null
    })

    // Apply calculations
    if (calculations && calculations.length > 0) {
      for (const calc of calculations) {
        groupRow[calc.name] = calculateAggregate(rows, calc.formula)
      }
    } else {
      // Default: count
      groupRow['count'] = rows.length
    }

    result.push(groupRow)
  }

  return result
}

/**
 * Calculate aggregate value from formula
 */
function calculateAggregate(rows: any[], formula: string): number | null {
  // Parse formula (e.g., "AVG(MILK)", "SUM(TOTM)", "COUNT(*)")
  const match = formula.match(/^(AVG|SUM|COUNT|MIN|MAX)\s*\(\s*([A-Z0-9*]+)\s*\)$/i)

  if (!match) {
    return null
  }

  const [, func, fieldCode] = match
  const dbField = fieldCode === '*' ? null : dairyCompToDb(fieldCode)

  switch (func.toUpperCase()) {
    case 'COUNT':
      return rows.length

    case 'SUM':
      if (!dbField) return null
      return rows.reduce((sum, row) => sum + (parseFloat(row[dbField]) || 0), 0)

    case 'AVG':
      if (!dbField) return null
      const sum = rows.reduce((s, row) => s + (parseFloat(row[dbField]) || 0), 0)
      return sum / rows.length

    case 'MIN':
      if (!dbField) return null
      const values = rows.map(row => parseFloat(row[dbField])).filter(v => !isNaN(v))
      return values.length > 0 ? Math.min(...values) : null

    case 'MAX':
      if (!dbField) return null
      const maxValues = rows.map(row => parseFloat(row[dbField])).filter(v => !isNaN(v))
      return maxValues.length > 0 ? Math.max(...maxValues) : null

    default:
      return null
  }
}

/**
 * Apply custom calculations to each row
 */
function applyCalculations(
  data: any[],
  calculations: CustomCalculation[]
): any[] {
  // For non-grouped reports, calculations are informational only
  // Return data as-is
  return data
}

/**
 * Get all report templates (system + user's custom)
 */
export async function getReportTemplates(): Promise<ReportTemplate[]> {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const tenantId = user.user_metadata?.tenant_id

  const { data, error } = await supabase
    .from('report_templates')
    .select('*')
    .or(`tenant_id.eq.${tenantId},is_public.eq.true,is_system.eq.true`)
    .is('deleted_at', null)
    .order('is_system', { ascending: false })
    .order('category')
    .order('name')

  if (error) {
    console.error('Failed to load report templates:', error)
    return []
  }

  return (data as any) || []
}

/**
 * Save a custom report template
 */
export async function saveReportTemplate(
  template: Omit<ReportTemplate, 'id' | 'created_at' | 'updated_at'>
): Promise<{ success: boolean; id?: string; error?: string }> {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { success: false, error: 'Authentication required' }
  }

  const tenantId = user.user_metadata?.tenant_id

  const { data, error } = await supabase
    .from('report_templates')
    .insert({
      ...(template as any),
      tenant_id: tenantId,
      created_by: user.id
    })
    .select('id')
    .single()

  if (error) {
    return { success: false, error: error.message }
  }

  return { success: true, id: data.id }
}

/**
 * Delete a report template
 */
export async function deleteReportTemplate(
  templateId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient()

  const { error } = await supabase
    .from('report_templates')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', templateId)

  if (error) {
    return { success: false, error: error.message }
  }

  return { success: true }
}
