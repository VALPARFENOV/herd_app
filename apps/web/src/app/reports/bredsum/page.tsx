'use client'

/**
 * BREDSUM Report Page - Breeding Performance Analysis
 * Supports 12 variants via tab interface
 */

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Calendar, Download, RefreshCw } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

// BREDSUM variant types
type BredsumVariant =
  | 'basic'
  | 'service'
  | 'month'
  | 'technician'
  | 'sire'
  | 'pen'
  | '21day'
  | 'heat'
  | 'qsum'
  | 'dim'
  | 'dow'
  | 'prostaglandin'

interface BredsumData {
  columns: string[]
  rows: any[]
  summary?: {
    totalBreedings: number
    totalPregnancies: number
    overallConceptionRate: number
  }
}

const VARIANT_INFO = {
  basic: {
    title: 'Basic BREDSUM',
    description: 'Breeding performance by lactation group',
    rpcFunction: 'calculate_bredsum_basic'
  },
  service: {
    title: 'By Service Number',
    description: 'Conception rates by AI service number (1st, 2nd, 3rd+)',
    rpcFunction: 'calculate_bredsum_by_service'
  },
  month: {
    title: 'By Calendar Month',
    description: 'Breeding trends by month',
    rpcFunction: 'calculate_bredsum_by_month'
  },
  technician: {
    title: 'By Technician',
    description: 'AI technician performance comparison',
    rpcFunction: 'calculate_bredsum_by_technician'
  },
  sire: {
    title: 'By Sire/Bull',
    description: 'Bull fertility comparison',
    rpcFunction: 'calculate_bredsum_by_sire'
  },
  pen: {
    title: 'By Pen/Group',
    description: 'Breeding performance by location',
    rpcFunction: 'calculate_bredsum_by_pen'
  },
  '21day': {
    title: '21-Day Pregnancy Rates',
    description: 'Weekly pregnancy rate trends',
    rpcFunction: 'calculate_bredsum_21day'
  },
  heat: {
    title: 'Heat Detection',
    description: 'Heat detection metrics and intervals',
    rpcFunction: 'calculate_bredsum_heat_detection'
  },
  qsum: {
    title: 'Q-Sum Conception Trend',
    description: 'Cumulative conception rate over time',
    rpcFunction: 'calculate_bredsum_qsum'
  },
  dim: {
    title: 'By DIM Range',
    description: 'Conception rates by days in milk',
    rpcFunction: 'calculate_bredsum_by_dim'
  },
  dow: {
    title: 'By Day of Week',
    description: 'Breeding success by weekday',
    rpcFunction: 'calculate_bredsum_by_dow'
  },
  prostaglandin: {
    title: 'Prostaglandin Protocols',
    description: 'Synchronization program analysis',
    rpcFunction: null // Not yet implemented
  }
}

const DATE_RANGES = [
  { value: '30', label: 'Last 30 days' },
  { value: '60', label: 'Last 60 days' },
  { value: '90', label: 'Last 90 days' },
  { value: '180', label: 'Last 6 months' },
  { value: '365', label: 'Last 12 months' }
]

export default function BredsumPage() {
  const [activeVariant, setActiveVariant] = useState<BredsumVariant>('basic')
  const [dateRange, setDateRange] = useState('90')
  const [data, setData] = useState<BredsumData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const supabase = createClient()

  // Load data when variant or date range changes
  useEffect(() => {
    loadData()
  }, [activeVariant, dateRange])

  async function loadData() {
    const variantInfo = VARIANT_INFO[activeVariant]

    if (!variantInfo.rpcFunction) {
      setError('This variant is not yet implemented')
      return
    }

    setLoading(true)
    setError(null)

    try {
      // Get tenant_id from user session
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setError('User not authenticated')
        return
      }

      const tenantId = user.user_metadata.tenant_id

      // Calculate date range
      const endDate = new Date()
      const startDate = new Date()
      startDate.setDate(startDate.getDate() - parseInt(dateRange))

      // Call RPC function
      const { data: rpcData, error: rpcError } = await supabase.rpc(variantInfo.rpcFunction, {
        p_tenant_id: tenantId,
        p_start_date: startDate.toISOString().split('T')[0],
        p_end_date: endDate.toISOString().split('T')[0]
      })

      if (rpcError) {
        setError(rpcError.message)
        return
      }

      // Format data
      if (rpcData && rpcData.length > 0) {
        const columns = Object.keys(rpcData[0])
        const rows = rpcData

        // Calculate summary stats
        const totalBreedings = rows.reduce((sum, row) => sum + (row.total_breedings || 0), 0)
        const totalPregnancies = rows.reduce((sum, row) => sum + (row.pregnancies || 0), 0)
        const overallConceptionRate = totalBreedings > 0
          ? (totalPregnancies / totalBreedings * 100)
          : 0

        setData({
          columns,
          rows,
          summary: {
            totalBreedings,
            totalPregnancies,
            overallConceptionRate
          }
        })
      } else {
        setData({ columns: [], rows: [] })
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  function exportToCSV() {
    if (!data || data.rows.length === 0) return

    // Create CSV content
    const headers = data.columns.join(',')
    const rows = data.rows.map(row =>
      data.columns.map(col => {
        const value = row[col]
        return typeof value === 'string' && value.includes(',')
          ? `"${value}"`
          : value
      }).join(',')
    ).join('\n')

    const csv = `${headers}\n${rows}`

    // Download
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `bredsum_${activeVariant}_${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  function formatColumnName(col: string): string {
    // Convert snake_case to Title Case
    return col
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
  }

  function formatCellValue(value: any, column: string): string {
    if (value === null || value === undefined) return '-'

    // Format percentages
    if (column.includes('rate') || column.includes('_cr')) {
      return `${parseFloat(value).toFixed(1)}%`
    }

    // Format decimals
    if (typeof value === 'number' && !Number.isInteger(value)) {
      return parseFloat(value).toFixed(2)
    }

    // Format dates
    if (column.includes('date') || column.includes('month')) {
      return value.toString()
    }

    return value.toString()
  }

  const variantInfo = VARIANT_INFO[activeVariant]

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">BREDSUM Reports</h1>
          <p className="text-muted-foreground">
            Breeding performance analysis and metrics
          </p>
        </div>

        <div className="flex items-center gap-4">
          {/* Date Range Selector */}
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-[180px]">
              <Calendar className="w-4 h-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {DATE_RANGES.map(range => (
                <SelectItem key={range.value} value={range.value}>
                  {range.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Refresh Button */}
          <Button
            variant="outline"
            size="icon"
            onClick={loadData}
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>

          {/* Export Button */}
          <Button
            variant="outline"
            onClick={exportToCSV}
            disabled={!data || data.rows.length === 0}
          >
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Tabs for variants */}
      <Tabs value={activeVariant} onValueChange={(v) => setActiveVariant(v as BredsumVariant)}>
        <TabsList className="grid grid-cols-6 lg:grid-cols-12 w-full">
          <TabsTrigger value="basic">Basic</TabsTrigger>
          <TabsTrigger value="service">Service #</TabsTrigger>
          <TabsTrigger value="month">Month</TabsTrigger>
          <TabsTrigger value="technician">Tech</TabsTrigger>
          <TabsTrigger value="sire">Sire</TabsTrigger>
          <TabsTrigger value="pen">Pen</TabsTrigger>
          <TabsTrigger value="21day">21-Day</TabsTrigger>
          <TabsTrigger value="heat">Heat</TabsTrigger>
          <TabsTrigger value="qsum">Q-Sum</TabsTrigger>
          <TabsTrigger value="dim">DIM</TabsTrigger>
          <TabsTrigger value="dow">Day</TabsTrigger>
          <TabsTrigger value="prostaglandin">PG</TabsTrigger>
        </TabsList>

        {/* Tab Content */}
        {Object.keys(VARIANT_INFO).map(variant => (
          <TabsContent key={variant} value={variant}>
            <Card>
              <CardHeader>
                <CardTitle>{VARIANT_INFO[variant as BredsumVariant].title}</CardTitle>
                <CardDescription>
                  {VARIANT_INFO[variant as BredsumVariant].description}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {/* Summary Stats */}
                {data?.summary && (
                  <div className="grid grid-cols-3 gap-4 mb-6 p-4 bg-muted rounded-lg">
                    <div>
                      <div className="text-sm text-muted-foreground">Total Breedings</div>
                      <div className="text-2xl font-bold">{data.summary.totalBreedings}</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Pregnancies</div>
                      <div className="text-2xl font-bold">{data.summary.totalPregnancies}</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Overall CR</div>
                      <div className="text-2xl font-bold">
                        {data.summary.overallConceptionRate.toFixed(1)}%
                      </div>
                    </div>
                  </div>
                )}

                {/* Loading State */}
                {loading && (
                  <div className="flex items-center justify-center py-12">
                    <RefreshCw className="w-8 h-8 animate-spin text-muted-foreground" />
                  </div>
                )}

                {/* Error State */}
                {error && (
                  <div className="bg-destructive/10 text-destructive px-4 py-3 rounded">
                    {error}
                  </div>
                )}

                {/* Data Table */}
                {!loading && !error && data && data.rows.length > 0 && (
                  <div className="border rounded-lg">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          {data.columns.map(col => (
                            <TableHead key={col}>{formatColumnName(col)}</TableHead>
                          ))}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {data.rows.map((row, idx) => (
                          <TableRow key={idx}>
                            {data.columns.map(col => (
                              <TableCell key={col}>
                                {formatCellValue(row[col], col)}
                              </TableCell>
                            ))}
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}

                {/* No Data State */}
                {!loading && !error && data && data.rows.length === 0 && (
                  <div className="text-center py-12 text-muted-foreground">
                    No breeding data found for the selected period
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}
