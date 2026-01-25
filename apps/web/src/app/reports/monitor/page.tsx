'use client'

/**
 * MONITOR Report - Key Performance Indicators Dashboard
 * DairyComp-style KPI summary for farm managers
 */

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AppLayout } from '@/components/layout/AppLayout'

interface MonitorMetrics {
  // Herd Size
  totalAnimals: number
  milkingCows: number
  dryCows: number
  heifers: number

  // Production
  avgMilkPerCow: number
  avgSCC: number
  avgFat: number
  avgProtein: number

  // Reproduction
  pregnancyRate: number
  avgDaysOpen: number
  toBreedCount: number
  freshCowsCount: number

  // Health
  highSCCCount: number
  freshCheckDue: number
}

export default function MonitorPage() {
  const [metrics, setMetrics] = useState<MonitorMetrics | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadMetrics()
  }, [])

  async function loadMetrics() {
    try {
      const supabase = createClient()

      // Get herd size metrics
      const { data: animals, error } = await supabase
        .from('animals_with_calculated')
        .select('current_status, reproductive_status, last_milk_kg, last_scc, last_fat_percent, last_protein_percent, days_open, dim')

      if (error) throw error

      const totalAnimals = animals?.length || 0
      const milkingCows = animals?.filter(a => a.current_status === 'milking').length || 0
      const dryCows = animals?.filter(a => a.current_status === 'dry').length || 0
      const heifers = animals?.filter(a => a.current_status === 'heifer').length || 0

      // Production metrics
      const milkingData = animals?.filter(a => a.current_status === 'milking' && a.last_milk_kg) || []
      const avgMilkPerCow = milkingData.length > 0
        ? milkingData.reduce((sum, a) => sum + (a.last_milk_kg || 0), 0) / milkingData.length
        : 0

      const sccData = milkingData.filter(a => a.last_scc)
      const avgSCC = sccData.length > 0
        ? sccData.reduce((sum, a) => sum + (a.last_scc || 0), 0) / sccData.length
        : 0

      const fatData = milkingData.filter(a => a.last_fat_percent)
      const avgFat = fatData.length > 0
        ? fatData.reduce((sum, a) => sum + (a.last_fat_percent || 0), 0) / fatData.length
        : 0

      const proteinData = milkingData.filter(a => a.last_protein_percent)
      const avgProtein = proteinData.length > 0
        ? proteinData.reduce((sum, a) => sum + (a.last_protein_percent || 0), 0) / proteinData.length
        : 0

      // Reproduction metrics
      const pregCows = animals?.filter(a => a.reproductive_status === 'preg').length || 0
      const eligibleCows = animals?.filter(a => a.current_status === 'milking' && a.dim && a.dim > 60).length || 0
      const pregnancyRate = eligibleCows > 0 ? (pregCows / eligibleCows) * 100 : 0

      const openCows = animals?.filter(a => a.reproductive_status === 'open' && a.days_open) || []
      const avgDaysOpen = openCows.length > 0
        ? openCows.reduce((sum, a) => sum + (a.days_open || 0), 0) / openCows.length
        : 0

      const toBreedCount = animals?.filter(a =>
        a.reproductive_status === 'open' && a.dim && a.dim > 60
      ).length || 0

      const freshCowsCount = animals?.filter(a => a.dim && a.dim <= 14).length || 0

      // Health metrics
      const highSCCCount = animals?.filter(a => a.last_scc && a.last_scc > 200000).length || 0
      const freshCheckDue = animals?.filter(a => a.dim && a.dim >= 7 && a.dim <= 14).length || 0

      setMetrics({
        totalAnimals,
        milkingCows,
        dryCows,
        heifers,
        avgMilkPerCow,
        avgSCC,
        avgFat,
        avgProtein,
        pregnancyRate,
        avgDaysOpen,
        toBreedCount,
        freshCowsCount,
        highSCCCount,
        freshCheckDue
      })
    } catch (error) {
      console.error('Error loading metrics:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-muted-foreground">Loading metrics...</div>
        </div>
      </AppLayout>
    )
  }

  if (!metrics) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-destructive">Failed to load metrics</div>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold">MONITOR Report</h1>
          <p className="text-muted-foreground">
            Key Performance Indicators - Updated {new Date().toLocaleDateString()}
          </p>
        </div>

        {/* Herd Size Section */}
        <div>
          <h2 className="text-xl font-semibold mb-3">Herd Size</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <MetricCard
              title="Total Animals"
              value={metrics.totalAnimals}
              format="number"
            />
            <MetricCard
              title="Milking Cows"
              value={metrics.milkingCows}
              format="number"
              subtitle={`${((metrics.milkingCows / metrics.totalAnimals) * 100).toFixed(1)}% of herd`}
            />
            <MetricCard
              title="Dry Cows"
              value={metrics.dryCows}
              format="number"
            />
            <MetricCard
              title="Heifers"
              value={metrics.heifers}
              format="number"
            />
          </div>
        </div>

        {/* Production Section */}
        <div>
          <h2 className="text-xl font-semibold mb-3">Production</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <MetricCard
              title="Avg Milk/Cow"
              value={metrics.avgMilkPerCow}
              format="decimal"
              unit="kg"
            />
            <MetricCard
              title="Avg SCC"
              value={metrics.avgSCC}
              format="number"
              unit="cells/ml"
              alert={metrics.avgSCC > 200000}
            />
            <MetricCard
              title="Avg Fat %"
              value={metrics.avgFat}
              format="percent"
            />
            <MetricCard
              title="Avg Protein %"
              value={metrics.avgProtein}
              format="percent"
            />
          </div>
        </div>

        {/* Reproduction Section */}
        <div>
          <h2 className="text-xl font-semibold mb-3">Reproduction</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <MetricCard
              title="Pregnancy Rate"
              value={metrics.pregnancyRate}
              format="percent"
            />
            <MetricCard
              title="Avg Days Open"
              value={metrics.avgDaysOpen}
              format="number"
              unit="days"
              alert={metrics.avgDaysOpen > 120}
            />
            <MetricCard
              title="To Breed"
              value={metrics.toBreedCount}
              format="number"
              unit="cows"
            />
            <MetricCard
              title="Fresh Cows"
              value={metrics.freshCowsCount}
              format="number"
              unit="cows"
            />
          </div>
        </div>

        {/* Health Section */}
        <div>
          <h2 className="text-xl font-semibold mb-3">Health</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <MetricCard
              title="High SCC"
              value={metrics.highSCCCount}
              format="number"
              unit="cows"
              alert={metrics.highSCCCount > 0}
              subtitle={">200k cells/ml"}
            />
            <MetricCard
              title="Fresh Check Due"
              value={metrics.freshCheckDue}
              format="number"
              unit="cows"
              subtitle="DIM 7-14"
            />
            <MetricCard
              title="Clinical Mastitis"
              value={0}
              format="number"
              unit="cases"
              subtitle="Last 30 days"
            />
            <MetricCard
              title="Lameness"
              value={0}
              format="number"
              unit="cases"
              subtitle="Active cases"
            />
          </div>
        </div>
      </div>
    </AppLayout>
  )
}

interface MetricCardProps {
  title: string
  value: number
  format: 'number' | 'decimal' | 'percent'
  unit?: string
  subtitle?: string
  alert?: boolean
}

function MetricCard({ title, value, format, unit, subtitle, alert }: MetricCardProps) {
  const formattedValue =
    format === 'number' ? Math.round(value).toLocaleString() :
    format === 'decimal' ? value.toFixed(1) :
    value.toFixed(1)

  return (
    <Card className={alert ? 'border-destructive' : ''}>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className={`text-2xl font-bold ${alert ? 'text-destructive' : ''}`}>
          {formattedValue}
          {format === 'percent' && '%'}
          {unit && <span className="text-sm font-normal ml-1">{unit}</span>}
        </div>
        {subtitle && (
          <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
        )}
      </CardContent>
    </Card>
  )
}
