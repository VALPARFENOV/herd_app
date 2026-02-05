import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { AlertTriangle, TrendingDown, TrendingUp, Droplet } from 'lucide-react'
import type { HerdQualityMetrics, BulkTankStats } from '@/lib/data/milk-quality'

interface QualityMetricsCardProps {
  herdMetrics: HerdQualityMetrics | null
  bulkTankStats: BulkTankStats | null
  highSCCCount: number
}

export function QualityMetricsCard({
  herdMetrics,
  bulkTankStats,
  highSCCCount,
}: QualityMetricsCardProps) {
  const getSCCBadgeColor = (scc: number | null | undefined) => {
    if (scc == null) return 'bg-gray-100 text-gray-800 hover:bg-gray-100'
    if (scc < 200000) return 'bg-green-100 text-green-800 hover:bg-green-100'
    if (scc < 400000) return 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100'
    return 'bg-red-100 text-red-800 hover:bg-red-100'
  }

  const formatSCC = (scc: number | null | undefined) => {
    if (scc == null) return 'N/A'
    if (scc >= 1000000) return `${(scc / 1000000).toFixed(1)}M`
    if (scc >= 1000) return `${(scc / 1000).toFixed(0)}K`
    return scc.toString()
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Droplet className="h-5 w-5 text-blue-600" />
          Milk Quality
        </CardTitle>
        <CardDescription>Last 30 days quality metrics</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Herd Average Metrics */}
          {herdMetrics && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Avg Milk/Test</p>
                <p className="text-2xl font-bold">{herdMetrics.avg_milk} kg</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Avg SCC</p>
                <Badge variant="outline" className={getSCCBadgeColor(herdMetrics.avg_scc)}>
                  {formatSCC(herdMetrics.avg_scc)}
                </Badge>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Fat %</p>
                <p className="text-xl font-semibold">{herdMetrics.avg_fat_percent}%</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Protein %</p>
                <p className="text-xl font-semibold">{herdMetrics.avg_protein_percent}%</p>
              </div>
            </div>
          )}

          {/* High SCC Alert */}
          {herdMetrics && herdMetrics.pct_high_scc > 0 && (
            <div className="flex items-center gap-2 rounded-lg bg-amber-50 p-3 border border-amber-200">
              <AlertTriangle className="h-4 w-4 text-amber-600 flex-shrink-0" />
              <div className="text-sm">
                <span className="font-medium text-amber-900">
                  {herdMetrics.pct_high_scc}% high SCC
                </span>
                <span className="text-amber-700 ml-1">
                  ({highSCCCount} {highSCCCount === 1 ? 'cow' : 'cows'})
                </span>
              </div>
            </div>
          )}

          {/* Bulk Tank Stats */}
          {bulkTankStats && (
            <div className="border-t pt-4">
              <p className="text-sm font-medium mb-3">Bulk Tank (30 days)</p>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-muted-foreground">Total Volume</p>
                  <p className="font-semibold">
                    {(bulkTankStats.total_volume / 1000).toFixed(1)}K L
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Revenue</p>
                  <p className="font-semibold text-green-600">
                    ${bulkTankStats.total_revenue.toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Avg Price/L</p>
                  <p className="font-semibold">${bulkTankStats.avg_price}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Tank SCC</p>
                  <Badge
                    variant="outline"
                    className={getSCCBadgeColor(bulkTankStats.avg_scc)}
                  >
                    {formatSCC(bulkTankStats.avg_scc)}
                  </Badge>
                </div>
              </div>
            </div>
          )}

          {/* Empty State */}
          {!herdMetrics && !bulkTankStats && (
            <div className="text-center py-6 text-muted-foreground">
              <p className="text-sm">No quality data available</p>
              <p className="text-xs mt-1">Import DHIA test results to see metrics</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
