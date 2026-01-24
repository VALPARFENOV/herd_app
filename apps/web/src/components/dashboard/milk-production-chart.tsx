"use client"

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface MilkProductionData {
  date: string
  total_kg: number
  avg_per_cow: number
}

interface MilkProductionChartProps {
  data: MilkProductionData[]
  title?: string
}

export function MilkProductionChart({
  data,
  title = "Milk Production (Last 30 Days)",
}: MilkProductionChartProps) {
  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-medium">{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-48 flex items-center justify-center text-muted-foreground border rounded-md">
            No milk production data available
          </div>
        </CardContent>
      </Card>
    )
  }

  // Calculate summary stats
  const totalProduction = data.reduce((sum, d) => sum + d.total_kg, 0)
  const avgDaily = Math.round(totalProduction / data.length)
  const avgPerCow =
    Math.round(
      (data.reduce((sum, d) => sum + d.avg_per_cow, 0) / data.length) * 10
    ) / 10

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-base font-medium">{title}</CardTitle>
        <div className="flex gap-4 text-sm">
          <div className="text-muted-foreground">
            Avg daily:{" "}
            <span className="font-medium text-foreground">
              {avgDaily.toLocaleString()} kg
            </span>
          </div>
          <div className="text-muted-foreground">
            Per cow:{" "}
            <span className="font-medium text-foreground">{avgPerCow} kg</span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-48 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={data}
              margin={{ top: 5, right: 10, left: 0, bottom: 5 }}
            >
              <defs>
                <linearGradient id="milkGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="5%"
                    stopColor="hsl(var(--primary))"
                    stopOpacity={0.3}
                  />
                  <stop
                    offset="95%"
                    stopColor="hsl(var(--primary))"
                    stopOpacity={0}
                  />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 10 }}
                tickFormatter={(value) => {
                  const date = new Date(value)
                  return date.toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  })
                }}
                className="text-muted-foreground"
              />
              <YAxis
                tick={{ fontSize: 10 }}
                tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
                className="text-muted-foreground"
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--background))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "6px",
                  fontSize: "12px",
                }}
                formatter={(value, name) => [
                  `${(value as number)?.toLocaleString() ?? 0} kg`,
                  name === "total_kg" ? "Total" : "Avg/cow",
                ]}
                labelFormatter={(label) =>
                  new Date(label).toLocaleDateString("en-US", {
                    weekday: "short",
                    month: "short",
                    day: "numeric",
                  })
                }
              />
              <Area
                type="monotone"
                dataKey="total_kg"
                stroke="hsl(var(--primary))"
                fill="url(#milkGradient)"
                strokeWidth={2}
                name="total_kg"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
