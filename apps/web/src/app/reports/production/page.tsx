'use client'

/**
 * Production Dashboard - Lactation curves and production analysis
 * Phase 3: Production Analysis
 */

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { RefreshCw, TrendingUp, BarChart3, Activity } from 'lucide-react'

interface ProductionMetrics {
  avgMilk: number
  avgFat: number
  avgProtein: number
  avgSCC: number
  testCount: number
  cowsWithHighSCC: number
}

interface LactationData {
  dim: number
  avgMilk: number
  sampleCount: number
  stdDev: number
}

export default function ProductionDashboardPage() {
  const [metrics, setMetrics] = useState<ProductionMetrics | null>(null)
  const [lactationCurve, setLactationCurve] = useState<LactationData[]>([])
  const [loading, setLoading] = useState(false)
  const [lactationFilter, setLactationFilter] = useState<string>('all')
  const [error, setError] = useState<string | null>(null)

  const supabase = createClient()

  useEffect(() => {
    loadData()
  }, [lactationFilter])

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

      // Load production metrics from milk_tests
      const { data: testsData, error: testsError } = await supabase
        .from('milk_tests')
        .select('milk_kg, fat_percent, protein_percent, scc')
        .eq('tenant_id', tenantId)
        .order('test_date', { ascending: false })
        .limit(100)

      if (testsError) {
        setError(testsError.message)
        return
      }

      // Calculate aggregate metrics
      const trendsData = testsData as any[]
      if (trendsData && trendsData.length > 0) {
        const totals = trendsData.reduce((acc: any, test: any) => ({
          milk: acc.milk + (test.milk_kg || 0),
          fat: acc.fat + (test.fat_percent || 0),
          protein: acc.protein + (test.protein_percent || 0),
          scc: acc.scc + (test.scc || 0),
          tests: acc.tests + 1,
          highSCC: acc.highSCC + ((test.scc || 0) > 200000 ? 1 : 0)
        }), { milk: 0, fat: 0, protein: 0, scc: 0, tests: 0, highSCC: 0 })

        setMetrics({
          avgMilk: totals.milk / trendsData.length,
          avgFat: totals.fat / trendsData.length,
          avgProtein: totals.protein / trendsData.length,
          avgSCC: totals.scc / trendsData.length,
          testCount: totals.tests,
          cowsWithHighSCC: totals.highSCC
        })
      }

      // Load lactation curve data
      const lactFilter = lactationFilter === 'all' ? null : parseInt(lactationFilter)

      const { data: curveData, error: curveError } = await supabase.rpc('get_average_lactation_curve', {
        p_tenant_id: tenantId,
        p_lactation_filter: lactFilter,
        p_field: 'MILK',
        p_max_dim: 305
      })

      if (curveError) {
        console.error('Lactation curve error:', curveError)
      } else {
        setLactationCurve((curveData as unknown as LactationData[]) || [])
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
          <h1 className="text-3xl font-bold">Production Dashboard</h1>
          <p className="text-muted-foreground">
            Lactation curves, test day analysis, and quality trends
          </p>
        </div>

        <div className="flex items-center gap-4">
          {/* Lactation Filter */}
          <Select value={lactationFilter} onValueChange={setLactationFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Lactations</SelectItem>
              <SelectItem value="1">1st Lactation</SelectItem>
              <SelectItem value="2">2nd Lactation</SelectItem>
              <SelectItem value="3">3+ Lactation</SelectItem>
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
              <CardTitle className="text-sm font-medium">Avg Milk/Cow</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.avgMilk.toFixed(1)} kg</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Components</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {metrics.avgFat.toFixed(2)}% / {metrics.avgProtein.toFixed(2)}%
              </div>
              <p className="text-xs text-muted-foreground">Fat / Protein</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg SCC</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {(metrics.avgSCC / 1000).toFixed(0)}k
              </div>
              <p className="text-xs text-muted-foreground">
                {metrics.cowsWithHighSCC} cows &gt;200k
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tests</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.testCount}</div>
              <p className="text-xs text-muted-foreground">Last 30 days</p>
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
      <Tabs defaultValue="lactation-curve" className="space-y-4">
        <TabsList>
          <TabsTrigger value="lactation-curve">Lactation Curve</TabsTrigger>
          <TabsTrigger value="test-day">Test Day Analysis</TabsTrigger>
          <TabsTrigger value="quality">Quality Trends</TabsTrigger>
        </TabsList>

        {/* Lactation Curve Tab */}
        <TabsContent value="lactation-curve" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Average Lactation Curve</CardTitle>
              <CardDescription>
                Herd average milk production by DIM
                {lactationFilter !== 'all' && ` (Lactation ${lactationFilter})`}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading && (
                <div className="flex items-center justify-center py-12">
                  <RefreshCw className="w-8 h-8 animate-spin text-muted-foreground" />
                </div>
              )}

              {!loading && lactationCurve.length > 0 && (
                <div className="space-y-4">
                  {/* Chart placeholder */}
                  <div className="h-64 bg-muted rounded-lg flex items-center justify-center">
                    <p className="text-muted-foreground">
                      Chart visualization (Recharts integration pending)
                    </p>
                  </div>

                  {/* Data table */}
                  <div className="border rounded-lg max-h-96 overflow-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>DIM</TableHead>
                          <TableHead>Avg Milk (kg)</TableHead>
                          <TableHead>Samples</TableHead>
                          <TableHead>Std Dev</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {lactationCurve.slice(0, 50).map((point) => (
                          <TableRow key={point.dim}>
                            <TableCell>{point.dim}</TableCell>
                            <TableCell>{Number(point.avgMilk).toFixed(1)}</TableCell>
                            <TableCell>{point.sampleCount}</TableCell>
                            <TableCell>
                              {point.stdDev ? Number(point.stdDev).toFixed(1) : '-'}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}

              {!loading && lactationCurve.length === 0 && (
                <div className="text-center py-12 text-muted-foreground">
                  No lactation data available
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Test Day Analysis Tab */}
        <TabsContent value="test-day" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Test Day Analysis</CardTitle>
              <CardDescription>
                Production trends from recent DHIA tests
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64 bg-muted rounded-lg flex items-center justify-center">
                <p className="text-muted-foreground">
                  Test day trends (Coming in Phase 3.1)
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Quality Trends Tab */}
        <TabsContent value="quality" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Milk Quality Trends</CardTitle>
              <CardDescription>
                SCC and component tracking over time
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64 bg-muted rounded-lg flex items-center justify-center">
                <p className="text-muted-foreground">
                  Quality trends (Coming in Phase 3.1)
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
