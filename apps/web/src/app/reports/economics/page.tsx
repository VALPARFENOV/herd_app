'use client'

/**
 * Economics Dashboard - ECON analysis, IOFC tracking, profitability
 * Phase 4: Economics Module
 */

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { RefreshCw, DollarSign, TrendingUp, PieChart, BarChart3 } from 'lucide-react'

interface EconomicMetrics {
  totalRevenue: number
  totalCosts: number
  iofc: number
  profitMargin: number
  avgRevenuePerCow: number
  avgIofcPerCow: number
}

interface IofcByPen {
  pen_name: string
  cow_count: number
  avg_milk_kg: number
  milk_revenue: number
  feed_costs: number
  iofc: number
  iofc_per_cow: number
}

interface ProfitabilityTrend {
  period_label: string
  milk_revenue: number
  total_costs: number
  iofc: number
  net_profit: number
  volume_kg: number
}

interface CostBreakdown {
  cost_type: string
  category: string
  total_amount: number
  entry_count: number
  percentage: number
}

export default function EconomicsDashboardPage() {
  const [metrics, setMetrics] = useState<EconomicMetrics | null>(null)
  const [penData, setPenData] = useState<IofcByPen[]>([])
  const [trends, setTrends] = useState<ProfitabilityTrend[]>([])
  const [costBreakdown, setCostBreakdown] = useState<CostBreakdown[]>([])
  const [loading, setLoading] = useState(false)
  const [dateRange, setDateRange] = useState<string>('30')
  const [error, setError] = useState<string | null>(null)

  const supabase = createClient()

  useEffect(() => {
    loadData()
  }, [dateRange])

  async function loadData() {
    setLoading(true)
    setError(null)

    try {
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

      const startDateStr = startDate.toISOString().split('T')[0]
      const endDateStr = endDate.toISOString().split('T')[0]

      // Load basic economics
      const { data: econData, error: econError } = await supabase.rpc('calculate_economics', {
        p_tenant_id: tenantId,
        p_start_date: startDateStr,
        p_end_date: endDateStr
      })

      if (econError) {
        setError(econError.message)
        return
      }

      // Parse economics data
      if (econData && econData.length > 0) {
        const revenueRow = econData.find((r: any) => r.metric === 'Total Milk Revenue')
        const costsRow = econData.find((r: any) => r.metric === 'Total Feed Costs')
        const iofcRow = econData.find((r: any) => r.metric === 'IOFC (Income Over Feed Cost)')
        const profitRow = econData.find((r: any) => r.metric === 'Net Profit')

        const revenue = parseFloat(revenueRow?.value || 0)
        const costs = parseFloat(costsRow?.value || 0)
        const iofc = parseFloat(iofcRow?.value || 0)
        const profit = parseFloat(profitRow?.value || 0)

        setMetrics({
          totalRevenue: revenue,
          totalCosts: costs,
          iofc: iofc,
          profitMargin: revenue > 0 ? (profit / revenue) * 100 : 0,
          avgRevenuePerCow: parseFloat(revenueRow?.per_cow || 0),
          avgIofcPerCow: parseFloat(iofcRow?.per_cow || 0)
        })
      }

      // Load IOFC by pen
      const { data: penIofc, error: penError } = await supabase.rpc('calculate_iofc_by_pen', {
        p_tenant_id: tenantId,
        p_start_date: startDateStr,
        p_end_date: endDateStr
      })

      if (penError) {
        console.error('Pen IOFC error:', penError)
      } else {
        setPenData(penIofc || [])
      }

      // Load profitability trends (weekly for 90 days)
      const trendStartDate = new Date()
      trendStartDate.setDate(trendStartDate.getDate() - 90)

      const { data: trendData, error: trendError } = await supabase.rpc('calculate_profitability_trends', {
        p_tenant_id: tenantId,
        p_start_date: trendStartDate.toISOString().split('T')[0],
        p_end_date: endDateStr,
        p_interval: 'week'
      })

      if (trendError) {
        console.error('Trends error:', trendError)
      } else {
        setTrends(trendData || [])
      }

      // Load cost breakdown
      const { data: costData, error: costError } = await supabase.rpc('get_cost_breakdown', {
        p_tenant_id: tenantId,
        p_start_date: startDateStr,
        p_end_date: endDateStr
      })

      if (costError) {
        console.error('Cost breakdown error:', costError)
      } else {
        setCostBreakdown(costData || [])
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Economics Dashboard</h1>
          <p className="text-muted-foreground">
            IOFC tracking, profitability analysis, and cost management
          </p>
        </div>

        <div className="flex items-center gap-4">
          {/* Date Range Selector */}
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="30">Last 30 Days</SelectItem>
              <SelectItem value="60">Last 60 Days</SelectItem>
              <SelectItem value="90">Last 90 Days</SelectItem>
              <SelectItem value="365">Last Year</SelectItem>
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
        </div>
      </div>

      {/* Summary Metrics */}
      {metrics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${formatNumber(metrics.totalRevenue)}</div>
              <p className="text-xs text-muted-foreground">
                ${formatNumber(metrics.avgRevenuePerCow)} per cow
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">IOFC</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${formatNumber(metrics.iofc)}</div>
              <p className="text-xs text-muted-foreground">
                ${formatNumber(metrics.avgIofcPerCow)} per cow
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Costs</CardTitle>
              <PieChart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${formatNumber(metrics.totalCosts)}</div>
              <p className="text-xs text-muted-foreground">
                Feed and operating expenses
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Profit Margin</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.profitMargin.toFixed(1)}%</div>
              <p className="text-xs text-muted-foreground">
                Net profit / Revenue
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-destructive/10 text-destructive px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* Tabs for different views */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
          <TabsTrigger value="costs">Cost Analysis</TabsTrigger>
        </TabsList>

        {/* Overview Tab - IOFC by Pen */}
        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>IOFC by Pen</CardTitle>
              <CardDescription>
                Profitability analysis by location (last {dateRange} days)
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading && (
                <div className="flex items-center justify-center py-12">
                  <RefreshCw className="w-8 h-8 animate-spin text-muted-foreground" />
                </div>
              )}

              {!loading && penData.length > 0 && (
                <div className="space-y-4">
                  {/* Chart placeholder */}
                  <div className="h-64 bg-muted rounded-lg flex items-center justify-center">
                    <p className="text-muted-foreground">
                      Bar chart visualization (Recharts integration pending)
                    </p>
                  </div>

                  {/* Data table */}
                  <div className="border rounded-lg">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Pen</TableHead>
                          <TableHead>Cows</TableHead>
                          <TableHead>Avg Milk (kg)</TableHead>
                          <TableHead>Revenue</TableHead>
                          <TableHead>Feed Costs</TableHead>
                          <TableHead>IOFC</TableHead>
                          <TableHead>IOFC/Cow</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {penData.map((pen, index) => (
                          <TableRow key={index}>
                            <TableCell className="font-medium">{pen.pen_name}</TableCell>
                            <TableCell>{pen.cow_count}</TableCell>
                            <TableCell>{parseFloat(pen.avg_milk_kg).toFixed(1)}</TableCell>
                            <TableCell>${formatNumber(parseFloat(pen.milk_revenue))}</TableCell>
                            <TableCell>${formatNumber(parseFloat(pen.feed_costs))}</TableCell>
                            <TableCell className="font-bold">
                              ${formatNumber(parseFloat(pen.iofc))}
                            </TableCell>
                            <TableCell>${formatNumber(parseFloat(pen.iofc_per_cow))}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}

              {!loading && penData.length === 0 && (
                <div className="text-center py-12 text-muted-foreground">
                  No pen-level economic data available
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Trends Tab */}
        <TabsContent value="trends" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Profitability Trends</CardTitle>
              <CardDescription>
                Weekly trends over last 90 days
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading && (
                <div className="flex items-center justify-center py-12">
                  <RefreshCw className="w-8 h-8 animate-spin text-muted-foreground" />
                </div>
              )}

              {!loading && trends.length > 0 && (
                <div className="space-y-4">
                  {/* Chart placeholder */}
                  <div className="h-80 bg-muted rounded-lg flex items-center justify-center">
                    <p className="text-muted-foreground">
                      Line chart visualization (Recharts integration pending)
                    </p>
                  </div>

                  {/* Data table */}
                  <div className="border rounded-lg max-h-96 overflow-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Week</TableHead>
                          <TableHead>Revenue</TableHead>
                          <TableHead>Costs</TableHead>
                          <TableHead>IOFC</TableHead>
                          <TableHead>Net Profit</TableHead>
                          <TableHead>Volume (kg)</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {trends.map((trend, index) => (
                          <TableRow key={index}>
                            <TableCell>{trend.period_label}</TableCell>
                            <TableCell>${formatNumber(parseFloat(trend.milk_revenue))}</TableCell>
                            <TableCell>${formatNumber(parseFloat(trend.total_costs))}</TableCell>
                            <TableCell className="font-bold">
                              ${formatNumber(parseFloat(trend.iofc))}
                            </TableCell>
                            <TableCell
                              className={parseFloat(trend.net_profit) >= 0 ? 'text-green-600' : 'text-red-600'}
                            >
                              ${formatNumber(parseFloat(trend.net_profit))}
                            </TableCell>
                            <TableCell>{formatNumber(parseFloat(trend.volume_kg))}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}

              {!loading && trends.length === 0 && (
                <div className="text-center py-12 text-muted-foreground">
                  No trend data available
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Cost Analysis Tab */}
        <TabsContent value="costs" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Cost Breakdown</CardTitle>
              <CardDescription>
                Cost analysis by type and category (last {dateRange} days)
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading && (
                <div className="flex items-center justify-center py-12">
                  <RefreshCw className="w-8 h-8 animate-spin text-muted-foreground" />
                </div>
              )}

              {!loading && costBreakdown.length > 0 && (
                <div className="space-y-4">
                  {/* Chart placeholder */}
                  <div className="h-64 bg-muted rounded-lg flex items-center justify-center">
                    <p className="text-muted-foreground">
                      Pie chart visualization (Recharts integration pending)
                    </p>
                  </div>

                  {/* Data table */}
                  <div className="border rounded-lg">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Type</TableHead>
                          <TableHead>Category</TableHead>
                          <TableHead>Total Amount</TableHead>
                          <TableHead>Entries</TableHead>
                          <TableHead>% of Total</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {costBreakdown.map((cost, index) => (
                          <TableRow key={index}>
                            <TableCell className="font-medium capitalize">
                              {cost.cost_type}
                            </TableCell>
                            <TableCell>{cost.category}</TableCell>
                            <TableCell>${formatNumber(parseFloat(cost.total_amount))}</TableCell>
                            <TableCell>{cost.entry_count}</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                                  <div
                                    className="h-full bg-primary"
                                    style={{ width: `${Math.min(parseFloat(cost.percentage), 100)}%` }}
                                  />
                                </div>
                                <span className="text-sm text-muted-foreground w-12 text-right">
                                  {parseFloat(cost.percentage).toFixed(1)}%
                                </span>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}

              {!loading && costBreakdown.length === 0 && (
                <div className="text-center py-12 text-muted-foreground">
                  No cost data available. Add cost entries to see breakdown.
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

/**
 * Format number with thousands separator
 */
function formatNumber(value: number): string {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value)
}
