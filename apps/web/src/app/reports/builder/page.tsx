'use client'

/**
 * Custom Report Builder - Visual query builder for custom reports
 * Phase 4: Custom Report Builder
 */

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Play, Save, Trash2, Plus, X } from 'lucide-react'
import { getAllItemCodes, getItemInfo, type FieldMapping } from '@/lib/cli/field-mapping'
import {
  executeReportTemplate,
  getReportTemplates,
  saveReportTemplate,
  type ReportTemplateData,
  type FilterRule,
  type SortRule,
  type ReportTemplate,
  type ReportResult
} from '@/lib/reports/executor'

export default function ReportBuilderPage() {
  // Template configuration
  const [templateName, setTemplateName] = useState('')
  const [templateDescription, setTemplateDescription] = useState('')
  const [selectedFields, setSelectedFields] = useState<string[]>(['ID', 'PEN', 'LACT', 'DIM'])
  const [filters, setFilters] = useState<FilterRule[]>([])
  const [sortRules, setSortRules] = useState<SortRule[]>([])

  // Execution state
  const [result, setResult] = useState<ReportResult | null>(null)
  const [executing, setExecuting] = useState(false)

  // Templates
  const [templates, setTemplates] = useState<ReportTemplate[]>([])
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null)

  // Available fields
  const [availableFields, setAvailableFields] = useState<string[]>([])

  useEffect(() => {
    // Load available fields
    const fields = getAllItemCodes()
    setAvailableFields(fields)

    // Load templates
    loadTemplates()
  }, [])

  async function loadTemplates() {
    const templates = await getReportTemplates()
    setTemplates(templates)
  }

  function addField(field: string) {
    if (!selectedFields.includes(field)) {
      setSelectedFields([...selectedFields, field])
    }
  }

  function removeField(field: string) {
    setSelectedFields(selectedFields.filter(f => f !== field))
  }

  function addFilter() {
    setFilters([...filters, { field: 'RC', operator: '=', value: '' }])
  }

  function updateFilter(index: number, updates: Partial<FilterRule>) {
    const newFilters = [...filters]
    newFilters[index] = { ...newFilters[index], ...updates }
    setFilters(newFilters)
  }

  function removeFilter(index: number) {
    setFilters(filters.filter((_, i) => i !== index))
  }

  function addSortRule() {
    setSortRules([...sortRules, { field: 'ID', direction: 'asc' }])
  }

  function updateSortRule(index: number, updates: Partial<SortRule>) {
    const newRules = [...sortRules]
    newRules[index] = { ...newRules[index], ...updates }
    setSortRules(newRules)
  }

  function removeSortRule(index: number) {
    setSortRules(sortRules.filter((_, i) => i !== index))
  }

  async function executeReport() {
    setExecuting(true)

    const templateData: ReportTemplateData = {
      fields: selectedFields,
      filters: filters.length > 0 ? filters : undefined,
      sortBy: sortRules.length > 0 ? sortRules : undefined,
      visualization: { type: 'table' }
    }

    const result = await executeReportTemplate(templateData)
    setResult(result)
    setExecuting(false)
  }

  async function saveTemplate() {
    if (!templateName.trim()) {
      alert('Please enter a template name')
      return
    }

    const template: Omit<ReportTemplate, 'id' | 'created_at' | 'updated_at'> = {
      name: templateName,
      description: templateDescription || undefined,
      category: 'custom',
      template_data: {
        fields: selectedFields,
        filters: filters.length > 0 ? filters : undefined,
        sortBy: sortRules.length > 0 ? sortRules : undefined,
        visualization: { type: 'table' }
      }
    }

    const { success, error } = await saveReportTemplate(template)

    if (success) {
      alert('Template saved successfully')
      setTemplateName('')
      setTemplateDescription('')
      loadTemplates()
    } else {
      alert(`Failed to save template: ${error}`)
    }
  }

  function loadTemplate(templateId: string) {
    const template = templates.find(t => t.id === templateId)
    if (!template) return

    setSelectedTemplate(templateId)
    setTemplateName(template.name)
    setTemplateDescription(template.description || '')
    setSelectedFields(template.template_data.fields)
    setFilters(template.template_data.filters || [])
    setSortRules(template.template_data.sortBy || [])
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Custom Report Builder</h1>
        <p className="text-muted-foreground">
          Create custom reports with field selection, filtering, and sorting
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Configuration Panel */}
        <div className="lg:col-span-2 space-y-6">
          {/* Template Info */}
          <Card>
            <CardHeader>
              <CardTitle>Report Configuration</CardTitle>
              <CardDescription>Define your custom report parameters</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="template-name">Template Name</Label>
                  <Input
                    id="template-name"
                    placeholder="My Custom Report"
                    value={templateName}
                    onChange={(e) => setTemplateName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="template-desc">Description</Label>
                  <Input
                    id="template-desc"
                    placeholder="Optional description"
                    value={templateDescription}
                    onChange={(e) => setTemplateDescription(e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Field Selection */}
          <Card>
            <CardHeader>
              <CardTitle>Fields</CardTitle>
              <CardDescription>Select fields to display in the report</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-2">
                {selectedFields.map(field => (
                  <Badge key={field} variant="secondary" className="flex items-center gap-1">
                    {field}
                    <button
                      onClick={() => removeField(field)}
                      className="ml-1 hover:text-destructive"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
              </div>

              <div className="flex gap-2">
                <Select onValueChange={addField}>
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Add field..." />
                  </SelectTrigger>
                  <SelectContent className="max-h-96">
                    {availableFields
                      .filter(f => !selectedFields.includes(f))
                      .map(field => {
                        const info = getItemInfo(field)
                        return (
                          <SelectItem key={field} value={field}>
                            {field} - {info?.description || ''}
                          </SelectItem>
                        )
                      })}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Filters */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Filters</CardTitle>
                  <CardDescription>Add conditions to filter results</CardDescription>
                </div>
                <Button size="sm" onClick={addFilter}>
                  <Plus className="w-4 h-4 mr-1" />
                  Add Filter
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              {filters.map((filter, index) => (
                <div key={index} className="flex gap-2 items-center">
                  <Select
                    value={filter.field}
                    onValueChange={(value) => updateFilter(index, { field: value })}
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {availableFields.map(field => (
                        <SelectItem key={field} value={field}>{field}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select
                    value={filter.operator}
                    onValueChange={(value: any) => updateFilter(index, { operator: value })}
                  >
                    <SelectTrigger className="w-24">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="=">=</SelectItem>
                      <SelectItem value=">">{'>'}</SelectItem>
                      <SelectItem value="<">{'<'}</SelectItem>
                      <SelectItem value=">=">{'>='}</SelectItem>
                      <SelectItem value="<=">{'<='}</SelectItem>
                      <SelectItem value="<>">{'<>'}</SelectItem>
                    </SelectContent>
                  </Select>

                  <Input
                    placeholder="Value"
                    value={filter.value}
                    onChange={(e) => updateFilter(index, { value: e.target.value })}
                    className="flex-1"
                  />

                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => removeFilter(index)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}

              {filters.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No filters added. Click "Add Filter" to add conditions.
                </p>
              )}
            </CardContent>
          </Card>

          {/* Sort Rules */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Sorting</CardTitle>
                  <CardDescription>Define sort order</CardDescription>
                </div>
                <Button size="sm" onClick={addSortRule}>
                  <Plus className="w-4 h-4 mr-1" />
                  Add Sort
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              {sortRules.map((rule, index) => (
                <div key={index} className="flex gap-2 items-center">
                  <Select
                    value={rule.field}
                    onValueChange={(value) => updateSortRule(index, { field: value })}
                  >
                    <SelectTrigger className="flex-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {selectedFields.map(field => (
                        <SelectItem key={field} value={field}>{field}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select
                    value={rule.direction}
                    onValueChange={(value: 'asc' | 'desc') => updateSortRule(index, { direction: value })}
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="asc">Ascending</SelectItem>
                      <SelectItem value="desc">Descending</SelectItem>
                    </SelectContent>
                  </Select>

                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => removeSortRule(index)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}

              {sortRules.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No sorting defined. Results will use default order.
                </p>
              )}
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex gap-2">
            <Button onClick={executeReport} disabled={executing || selectedFields.length === 0}>
              <Play className="w-4 h-4 mr-1" />
              {executing ? 'Running...' : 'Run Report'}
            </Button>
            <Button variant="outline" onClick={saveTemplate} disabled={!templateName.trim()}>
              <Save className="w-4 h-4 mr-1" />
              Save Template
            </Button>
          </div>
        </div>

        {/* Template Library */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Template Library</CardTitle>
              <CardDescription>Pre-built and saved templates</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {templates.map(template => (
                <button
                  key={template.id}
                  onClick={() => loadTemplate(template.id!)}
                  className={`w-full text-left p-3 rounded border transition-colors ${
                    selectedTemplate === template.id
                      ? 'border-primary bg-primary/10'
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  <div className="font-medium">{template.name}</div>
                  {template.description && (
                    <div className="text-sm text-muted-foreground">{template.description}</div>
                  )}
                  {template.is_system && (
                    <Badge variant="secondary" className="mt-1">System</Badge>
                  )}
                </button>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Results */}
      {result && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Results</CardTitle>
                <CardDescription>
                  {result.success
                    ? `${result.rowCount} rows in ${result.executionTime}ms`
                    : 'Error executing report'}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {result.success && result.data && result.data.length > 0 ? (
              <div className="border rounded-lg max-h-96 overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      {result.columns?.map(col => (
                        <TableHead key={col}>{col}</TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {result.data.slice(0, 100).map((row, index) => (
                      <TableRow key={index}>
                        {result.columns?.map(col => {
                          const dbField = require('@/lib/cli/field-mapping').dairyCompToDb(col)
                          return (
                            <TableCell key={col}>
                              {row[dbField] !== null && row[dbField] !== undefined
                                ? String(row[dbField])
                                : '-'}
                            </TableCell>
                          )
                        })}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : result.error ? (
              <div className="text-destructive">{result.error}</div>
            ) : (
              <div className="text-muted-foreground">No results</div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
