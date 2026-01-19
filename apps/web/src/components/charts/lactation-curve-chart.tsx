"use client"

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Legend,
} from "recharts"

interface MilkDataPoint {
  dim: number
  milk_kg: number
  projected?: number
}

interface LactationCurveChartProps {
  data: MilkDataPoint[]
  me305Projection?: number | null
  showProjection?: boolean
}

export function LactationCurveChart({
  data,
  me305Projection,
  showProjection = true,
}: LactationCurveChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="h-48 flex items-center justify-center text-muted-foreground border rounded-md flex-col">
        <span>No milk data recorded yet</span>
        {me305Projection && (
          <span className="text-sm mt-2">
            305ME Projection: {me305Projection.toLocaleString()} kg
          </span>
        )}
      </div>
    )
  }

  // Generate a standard lactation curve for comparison
  const generateStandardCurve = (): MilkDataPoint[] => {
    const points: MilkDataPoint[] = []
    // Wood's lactation curve model: y = a * DIM^b * e^(-c*DIM)
    const a = 30 // scale
    const b = 0.25 // rate of increase to peak
    const c = 0.003 // rate of decline from peak

    for (let dim = 1; dim <= 305; dim += 7) {
      const milk = a * Math.pow(dim, b) * Math.exp(-c * dim)
      points.push({ dim, milk_kg: 0, projected: Math.round(milk * 10) / 10 })
    }
    return points
  }

  // Merge actual data with standard curve projection
  const mergedData = data.map((point) => {
    const standardValue =
      30 * Math.pow(point.dim, 0.25) * Math.exp(-0.003 * point.dim)
    return {
      ...point,
      projected: showProjection ? Math.round(standardValue * 10) / 10 : undefined,
    }
  })

  // Add projected points beyond actual data if showing projection
  if (showProjection && data.length > 0) {
    const maxDim = Math.max(...data.map((d) => d.dim))
    for (let dim = maxDim + 7; dim <= 305; dim += 7) {
      const standardValue = 30 * Math.pow(dim, 0.25) * Math.exp(-0.003 * dim)
      mergedData.push({
        dim,
        milk_kg: 0,
        projected: Math.round(standardValue * 10) / 10,
      })
    }
  }

  const maxMilk = Math.max(
    ...data.map((d) => d.milk_kg),
    ...(showProjection ? mergedData.map((d) => d.projected || 0) : [])
  )

  return (
    <div className="h-48 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={mergedData}
          margin={{ top: 5, right: 10, left: 0, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
          <XAxis
            dataKey="dim"
            tick={{ fontSize: 11 }}
            label={{
              value: "Days in Milk",
              position: "insideBottomRight",
              offset: -5,
              style: { fontSize: 10 },
            }}
            className="text-muted-foreground"
          />
          <YAxis
            tick={{ fontSize: 11 }}
            label={{
              value: "kg/day",
              angle: -90,
              position: "insideLeft",
              style: { fontSize: 10 },
            }}
            domain={[0, Math.ceil(maxMilk * 1.1)]}
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
              `${value ?? 0} kg`,
              name === "milk_kg" ? "Actual" : "Standard Curve",
            ]}
            labelFormatter={(dim) => `DIM: ${dim}`}
          />
          <Legend
            wrapperStyle={{ fontSize: "11px" }}
            formatter={(value) =>
              value === "milk_kg" ? "Actual" : "Standard Curve"
            }
          />
          {showProjection && (
            <Line
              type="monotone"
              dataKey="projected"
              stroke="hsl(var(--muted-foreground))"
              strokeDasharray="5 5"
              strokeWidth={1}
              dot={false}
              name="projected"
            />
          )}
          <Line
            type="monotone"
            dataKey="milk_kg"
            stroke="hsl(var(--primary))"
            strokeWidth={2}
            dot={{ r: 2 }}
            activeDot={{ r: 4 }}
            name="milk_kg"
            connectNulls={false}
          />
          {/* Peak marker at ~60 DIM */}
          <ReferenceLine
            x={60}
            stroke="hsl(var(--muted-foreground))"
            strokeDasharray="3 3"
            label={{
              value: "Peak",
              position: "top",
              style: { fontSize: 10, fill: "hsl(var(--muted-foreground))" },
            }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
