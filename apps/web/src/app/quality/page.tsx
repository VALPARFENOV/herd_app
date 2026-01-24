import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Droplet, AlertTriangle, TrendingUp, DollarSign } from 'lucide-react'
import {
  getQualityDashboardData,
  getBulkTankChartData,
  getRecentMilkTests,
} from '@/lib/data/milk-quality'

export default async function QualityPage() {
  const [qualityData, bulkTankChart, recentTests] = await Promise.all([
    getQualityDashboardData(),
    getBulkTankChartData(30),
    getRecentMilkTests(20),
  ])

  const { herd_metrics, bulk_tank_stats, high_scc_animals } = qualityData

  const formatSCC = (scc: number) => {
    if (scc >= 1000000) return `${(scc / 1000000).toFixed(1)}M`
    if (scc >= 1000) return `${(scc / 1000).toFixed(0)}K`
    return scc.toString()
  }

  const getSCCBadgeColor = (scc: number) => {
    if (scc < 200000) return 'bg-green-100 text-green-800 hover:bg-green-100'
    if (scc < 400000) return 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100'
    return 'bg-red-100 text-red-800 hover:bg-red-100'
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Milk Quality Monitoring</h1>
        <p className="text-muted-foreground mt-2">DHIA tests, bulk tank, and quality metrics</p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Herd Avg SCC</CardTitle>
            <Droplet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {herd_metrics ? (
              <>
                <div className="text-2xl font-bold">{formatSCC(herd_metrics.avg_scc)}</div>
                <Badge
                  variant="outline"
                  className={`mt-2 ${getSCCBadgeColor(herd_metrics.avg_scc)}`}
                >
                  {herd_metrics.avg_scc < 200000 ? 'Excellent' : herd_metrics.avg_scc < 400000 ? 'Acceptable' : 'Poor'}
                </Badge>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">No data</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">High SCC Cows</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{high_scc_animals.length}</div>
            <p className="text-xs text-muted-foreground mt-2">
              {herd_metrics && `${herd_metrics.pct_high_scc}% of tested cows`}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Components</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {herd_metrics ? (
              <>
                <div className="text-2xl font-bold">
                  {herd_metrics.avg_fat_percent}% / {herd_metrics.avg_protein_percent}%
                </div>
                <p className="text-xs text-muted-foreground mt-2">Fat / Protein</p>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">No data</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenue (30d)</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {bulk_tank_stats ? (
              <>
                <div className="text-2xl font-bold text-green-600">
                  ${bulk_tank_stats.total_revenue.toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  ${bulk_tank_stats.avg_price}/L avg
                </p>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">No data</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* High SCC Animals */}
      {high_scc_animals.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>High SCC Animals</CardTitle>
            <CardDescription>
              Cows with SCC &gt; 200,000 requiring attention
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ear Tag</TableHead>
                  <TableHead>Latest SCC</TableHead>
                  <TableHead>Test Date</TableHead>
                  <TableHead>Consecutive High Tests</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {high_scc_animals.map((animal) => (
                  <TableRow key={animal.animal_id}>
                    <TableCell className="font-mono font-medium">{animal.ear_tag}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={getSCCBadgeColor(animal.latest_scc)}>
                        {formatSCC(animal.latest_scc)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {new Date(animal.test_date).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {animal.consecutive_high_tests} test{animal.consecutive_high_tests !== 1 ? 's' : ''}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {animal.latest_scc > 400000 ? (
                        <Badge variant="destructive">Clinical Risk</Badge>
                      ) : (
                        <Badge variant="outline" className="bg-yellow-100 text-yellow-800">
                          Subclinical
                        </Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Recent Milk Tests */}
      {recentTests.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Milk Tests</CardTitle>
            <CardDescription>Last 20 DHIA test results</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ear Tag</TableHead>
                  <TableHead>Test Date</TableHead>
                  <TableHead>DIM</TableHead>
                  <TableHead>Milk (kg)</TableHead>
                  <TableHead>Fat %</TableHead>
                  <TableHead>Protein %</TableHead>
                  <TableHead>SCC</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentTests.map((test) => (
                  <TableRow key={test.id}>
                    <TableCell className="font-mono font-medium">
                      {test.animal_ear_tag}
                    </TableCell>
                    <TableCell>{new Date(test.test_date).toLocaleDateString()}</TableCell>
                    <TableCell>{test.dim || '-'}</TableCell>
                    <TableCell>{test.milk_kg}</TableCell>
                    <TableCell>{test.fat_percent}%</TableCell>
                    <TableCell>{test.protein_percent}%</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={getSCCBadgeColor(test.scc)}>
                        {formatSCC(test.scc)}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {!herd_metrics && !bulk_tank_stats && (
        <Card>
          <CardContent className="py-12">
            <div className="text-center text-muted-foreground">
              <Droplet className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">No quality data available</p>
              <p className="text-sm mt-2">
                Import DHIA test results and bulk tank readings to see quality metrics
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
