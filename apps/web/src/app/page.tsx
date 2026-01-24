import { Milk, Users, Droplets, Activity } from "lucide-react"
import { StatCard } from "@/components/dashboard/stat-card"
import { TaskCounters } from "@/components/dashboard/task-counters"
import { AlertsList } from "@/components/dashboard/alerts-list"
import { RCDistributionChart } from "@/components/dashboard/rc-distribution-chart"
import { MilkProductionChart } from "@/components/dashboard/milk-production-chart"
import { QualityMetricsCard } from "@/components/dashboard/quality-metrics-card"
import { getDashboardStats, getDashboardTasks, getDashboardAlerts } from "@/lib/data/dashboard"
import { getDailyMilkProduction } from "@/lib/data/milk-production"
import { getQualityDashboardData } from "@/lib/data/milk-quality"

export default async function DashboardPage() {
  const [stats, tasks, alerts, milkProduction, qualityData] = await Promise.all([
    getDashboardStats(),
    getDashboardTasks(),
    getDashboardAlerts(),
    getDailyMilkProduction(30),
    getQualityDashboardData(),
  ])

  const today = new Date().toLocaleDateString("en-US", {
    day: "numeric",
    month: "long",
    year: "numeric",
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">Farm overview and daily tasks</p>
        </div>
        <div className="text-sm text-muted-foreground">{today}</div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Herd"
          value={stats.totalHerd.toString()}
          subtitle="animals"
          icon={Users}
        />
        <StatCard
          title="Milking"
          value={stats.milking.toString()}
          subtitle="cows in milk"
          icon={Milk}
        />
        <StatCard
          title="Dry"
          value={stats.dry.toString()}
          subtitle="cows dry"
          icon={Droplets}
        />
        <StatCard
          title="Heifers"
          value={stats.heifers.toString()}
          subtitle="not yet calved"
          icon={Activity}
        />
      </div>

      <TaskCounters tasks={tasks} />

      {/* Milk production chart - real data from TimescaleDB */}
      <MilkProductionChart
        data={milkProduction.map((d) => ({
          date: d.date,
          total_kg: d.totalKg,
          avg_per_cow: d.avgPerCow,
        }))}
      />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <RCDistributionChart data={stats.distribution} total={stats.totalHerd} />
        <AlertsList alerts={alerts} />
        <QualityMetricsCard
          herdMetrics={qualityData.herd_metrics}
          bulkTankStats={qualityData.bulk_tank_stats}
          highSCCCount={qualityData.high_scc_animals.length}
        />
      </div>
    </div>
  )
}
