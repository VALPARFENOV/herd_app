import { Milk, Users, Droplets, Activity } from "lucide-react"
import { StatCard } from "@/components/dashboard/stat-card"
import { TaskCounters } from "@/components/dashboard/task-counters"
import { AlertsList } from "@/components/dashboard/alerts-list"
import { RCDistributionChart } from "@/components/dashboard/rc-distribution-chart"
import {
  MilkProductionChart,
  generateSampleMilkProductionData,
} from "@/components/dashboard/milk-production-chart"
import { getDashboardStats, getDashboardTasks, getDashboardAlerts } from "@/lib/data/dashboard"

export default async function DashboardPage() {
  const [stats, tasks, alerts] = await Promise.all([
    getDashboardStats(),
    getDashboardTasks(),
    getDashboardAlerts(),
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

      {/* Milk production chart - uses sample data until milk_readings table is implemented */}
      <MilkProductionChart data={generateSampleMilkProductionData(30, stats.milking || 100)} />

      <div className="grid gap-4 md:grid-cols-2">
        <RCDistributionChart data={stats.distribution} total={stats.totalHerd} />
        <AlertsList alerts={alerts} />
      </div>
    </div>
  )
}
