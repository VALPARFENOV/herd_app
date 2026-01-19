"use client"

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Cell,
} from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface BCSDataPoint {
  score: string
  count: number
}

interface BCSDistributionChartProps {
  data: BCSDataPoint[]
  title?: string
}

// Target BCS range for dairy cows (2.75 - 3.50)
const TARGET_MIN = 2.75
const TARGET_MAX = 3.5

const getBarColor = (score: string) => {
  const numScore = parseFloat(score)
  if (numScore >= TARGET_MIN && numScore <= TARGET_MAX) {
    return "hsl(var(--chart-2))" // Green - optimal
  }
  if (numScore < 2.5 || numScore > 4) {
    return "hsl(var(--destructive))" // Red - critical
  }
  return "hsl(var(--chart-4))" // Yellow - warning
}

export function BCSDistributionChart({
  data,
  title = "BCS Distribution",
}: BCSDistributionChartProps) {
  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-medium">{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-48 flex items-center justify-center text-muted-foreground border rounded-md">
            No BCS data available
          </div>
        </CardContent>
      </Card>
    )
  }

  const totalAnimals = data.reduce((sum, d) => sum + d.count, 0)
  const animalsInTarget = data
    .filter((d) => {
      const score = parseFloat(d.score)
      return score >= TARGET_MIN && score <= TARGET_MAX
    })
    .reduce((sum, d) => sum + d.count, 0)
  const percentInTarget =
    totalAnimals > 0 ? Math.round((animalsInTarget / totalAnimals) * 100) : 0

  // Calculate average BCS
  const weightedSum = data.reduce(
    (sum, d) => sum + parseFloat(d.score) * d.count,
    0
  )
  const avgBCS = totalAnimals > 0 ? (weightedSum / totalAnimals).toFixed(2) : "—"

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-base font-medium">{title}</CardTitle>
        <div className="flex gap-4 text-sm">
          <div className="text-muted-foreground">
            Avg: <span className="font-medium text-foreground">{avgBCS}</span>
          </div>
          <div className="text-muted-foreground">
            In target:{" "}
            <span className="font-medium text-foreground">
              {percentInTarget}%
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-48 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              margin={{ top: 5, right: 10, left: 0, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis
                dataKey="score"
                tick={{ fontSize: 11 }}
                className="text-muted-foreground"
              />
              <YAxis
                tick={{ fontSize: 11 }}
                allowDecimals={false}
                className="text-muted-foreground"
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--background))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "6px",
                  fontSize: "12px",
                }}
                formatter={(value) => [`${value ?? 0} animals`, "Count"]}
                labelFormatter={(score) => `BCS: ${score}`}
              />
              <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={getBarColor(entry.score)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="flex justify-center gap-4 mt-2 text-xs">
          <div className="flex items-center gap-1">
            <div
              className="w-3 h-3 rounded"
              style={{ backgroundColor: "hsl(var(--chart-2))" }}
            />
            <span>Target (2.75-3.50)</span>
          </div>
          <div className="flex items-center gap-1">
            <div
              className="w-3 h-3 rounded"
              style={{ backgroundColor: "hsl(var(--chart-4))" }}
            />
            <span>Warning</span>
          </div>
          <div className="flex items-center gap-1">
            <div
              className="w-3 h-3 rounded"
              style={{ backgroundColor: "hsl(var(--destructive))" }}
            />
            <span>Critical</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// Helper to generate sample BCS data for demo
export function generateSampleBCSData(): BCSDataPoint[] {
  // Typical BCS distribution for a well-managed dairy herd
  // Most cows should be in the 2.75-3.50 range
  const scores = [
    "1.5",
    "2.0",
    "2.5",
    "2.75",
    "3.0",
    "3.25",
    "3.5",
    "3.75",
    "4.0",
    "4.5",
    "5.0",
  ]

  // Bell curve centered around 3.0-3.25
  const distribution = [2, 5, 12, 18, 28, 22, 15, 8, 4, 2, 1]

  return scores.map((score, i) => ({
    score,
    count: distribution[i] + Math.floor(Math.random() * 5) - 2,
  }))
}
