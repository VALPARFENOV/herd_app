"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface RCDistributionData {
  label: string
  value: number
  percentage: number
  color: string
}

interface RCDistributionChartProps {
  data: RCDistributionData[]
  total: number
}

export function RCDistributionChart({ data, total }: RCDistributionChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-medium">Status Distribution</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-center mb-6">
          <div className="relative w-40 h-40">
            <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
              {(() => {
                let cumulativePercentage = 0
                return data.map((item, index) => {
                  const startAngle = cumulativePercentage * 3.6
                  const endAngle = (cumulativePercentage + item.percentage) * 3.6
                  cumulativePercentage += item.percentage

                  const startRad = (startAngle * Math.PI) / 180
                  const endRad = (endAngle * Math.PI) / 180

                  const x1 = 50 + 40 * Math.cos(startRad)
                  const y1 = 50 + 40 * Math.sin(startRad)
                  const x2 = 50 + 40 * Math.cos(endRad)
                  const y2 = 50 + 40 * Math.sin(endRad)

                  const largeArcFlag = item.percentage > 50 ? 1 : 0

                  return (
                    <path
                      key={index}
                      d={`M 50 50 L ${x1} ${y1} A 40 40 0 ${largeArcFlag} 1 ${x2} ${y2} Z`}
                      fill={item.color}
                      stroke="white"
                      strokeWidth="1"
                    />
                  )
                })
              })()}
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className="text-2xl font-bold">{total}</div>
                <div className="text-xs text-muted-foreground">Total</div>
              </div>
            </div>
          </div>
        </div>
        <div className="space-y-2">
          {data.map((item, index) => (
            <div key={index} className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <span
                  className="h-3 w-3 rounded-full"
                  style={{ backgroundColor: item.color }}
                />
                <span className="text-muted-foreground">{item.label}</span>
              </div>
              <span className="font-medium">
                {item.value} ({item.percentage}%)
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
