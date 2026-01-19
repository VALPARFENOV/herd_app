"use client"

import { cn } from "@/lib/utils"

interface QuarterData {
  quarter: string
  scc: number
  cmt: string
  pathogen: string | null
}

interface UdderQuarterChartProps {
  data: QuarterData[]
}

const quarterPositions: Record<string, { label: string; position: string }> = {
  LF: { label: "Left Front", position: "col-start-1 row-start-1" },
  RF: { label: "Right Front", position: "col-start-2 row-start-1" },
  LR: { label: "Left Rear", position: "col-start-1 row-start-2" },
  RR: { label: "Right Rear", position: "col-start-2 row-start-2" },
}

export function UdderQuarterChart({ data }: UdderQuarterChartProps) {
  const getQuarterData = (quarter: string) => {
    return data.find(d => d.quarter === quarter)
  }

  const getSCCStatus = (scc: number) => {
    if (scc < 100) return { color: "bg-green-500", text: "Healthy" }
    if (scc < 200) return { color: "bg-green-400", text: "Normal" }
    if (scc < 400) return { color: "bg-yellow-400", text: "Elevated" }
    if (scc < 800) return { color: "bg-orange-400", text: "High" }
    return { color: "bg-red-500", text: "Critical" }
  }

  const getCMTColor = (cmt: string) => {
    switch (cmt) {
      case "-": return "text-green-600"
      case "+": return "text-yellow-600"
      case "++": return "text-orange-600"
      case "+++": return "text-red-600"
      default: return "text-muted-foreground"
    }
  }

  return (
    <div className="space-y-4">
      {/* Udder diagram */}
      <div className="relative w-full max-w-[200px] mx-auto">
        {/* Visual representation */}
        <div className="grid grid-cols-2 gap-2">
          {["LF", "RF", "LR", "RR"].map((quarter) => {
            const qData = getQuarterData(quarter)
            const status = qData ? getSCCStatus(qData.scc) : { color: "bg-gray-300", text: "No data" }

            return (
              <div
                key={quarter}
                className={cn(
                  "aspect-square rounded-full flex flex-col items-center justify-center text-white font-medium transition-all cursor-pointer hover:scale-105",
                  status.color
                )}
                title={qData ? `SCC: ${qData.scc}K, CMT: ${qData.cmt}${qData.pathogen ? `, Pathogen: ${qData.pathogen}` : ''}` : 'No data'}
              >
                <div className="text-xs opacity-90">{quarter}</div>
                {qData && (
                  <div className="text-lg font-bold">{qData.scc}</div>
                )}
              </div>
            )
          })}
        </div>

        {/* Labels */}
        <div className="grid grid-cols-2 gap-2 mt-1 text-center text-[10px] text-muted-foreground">
          <div>Left</div>
          <div>Right</div>
        </div>
        <div className="absolute -left-6 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground -rotate-90">
          Front / Rear
        </div>
      </div>

      {/* Details table */}
      <div className="space-y-2">
        {["LF", "RF", "LR", "RR"].map((quarter) => {
          const qData = getQuarterData(quarter)
          if (!qData) return null

          const status = getSCCStatus(qData.scc)

          return (
            <div
              key={quarter}
              className="flex items-center justify-between text-sm border-b pb-1"
            >
              <div className="flex items-center gap-2">
                <div className={cn("w-3 h-3 rounded-full", status.color)} />
                <span className="font-medium w-8">{quarter}</span>
              </div>
              <div className="flex items-center gap-4">
                <span>SCC: <strong>{qData.scc}K</strong></span>
                <span className={cn("font-mono", getCMTColor(qData.cmt))}>
                  CMT: {qData.cmt}
                </span>
                {qData.pathogen && (
                  <span className="text-red-600 text-xs">
                    {qData.pathogen}
                  </span>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap justify-center gap-3 text-xs">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-full bg-green-500" />
          <span>&lt;100K</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-full bg-green-400" />
          <span>100-200K</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-full bg-yellow-400" />
          <span>200-400K</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-full bg-orange-400" />
          <span>400-800K</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-full bg-red-500" />
          <span>&gt;800K</span>
        </div>
      </div>
    </div>
  )
}
