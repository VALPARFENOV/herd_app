"use client"

import { cn } from "@/lib/utils"

interface Lesion {
  leg: string
  claw: string
  zone: number
  type: string
  severity: number
}

interface HoofMapProps {
  lesions: Lesion[]
  date?: string
}

const legLabels: Record<string, string> = {
  LF: "Left Front",
  RF: "Right Front",
  LR: "Left Rear",
  RR: "Right Rear",
}

export function HoofMap({ lesions, date }: HoofMapProps) {
  const getLegLesions = (leg: string) => {
    return lesions.filter(l => l.leg === leg)
  }

  const getSeverityColor = (severity: number) => {
    switch (severity) {
      case 0: return "bg-green-100 border-green-300"
      case 1: return "bg-yellow-100 border-yellow-300"
      case 2: return "bg-orange-100 border-orange-300"
      case 3: return "bg-red-100 border-red-300"
      default: return "bg-gray-100 border-gray-300"
    }
  }

  const hasLesion = (leg: string, claw: string) => {
    return lesions.some(l => l.leg === leg && l.claw === claw)
  }

  const getLesionInfo = (leg: string, claw: string) => {
    const legLesions = lesions.filter(l => l.leg === leg && l.claw === claw)
    if (legLesions.length === 0) return null
    const maxSeverity = Math.max(...legLesions.map(l => l.severity))
    return { count: legLesions.length, maxSeverity, lesions: legLesions }
  }

  return (
    <div className="space-y-4">
      {date && (
        <div className="text-sm text-muted-foreground text-center">
          Inspection: {date}
        </div>
      )}

      {/* Cow diagram - top view */}
      <div className="relative w-full max-w-xs mx-auto">
        {/* Front */}
        <div className="text-center text-xs text-muted-foreground mb-2">FRONT</div>

        <div className="grid grid-cols-2 gap-4 mb-8">
          {/* Left Front */}
          <HoofDiagram
            leg="LF"
            label={legLabels.LF}
            innerLesion={getLesionInfo("LF", "inner")}
            outerLesion={getLesionInfo("LF", "outer")}
          />
          {/* Right Front */}
          <HoofDiagram
            leg="RF"
            label={legLabels.RF}
            innerLesion={getLesionInfo("RF", "inner")}
            outerLesion={getLesionInfo("RF", "outer")}
          />
        </div>

        {/* Body representation */}
        <div className="flex justify-center mb-8">
          <div className="w-24 h-16 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center">
            <span className="text-xs text-muted-foreground">Body</span>
          </div>
        </div>

        {/* Rear */}
        <div className="grid grid-cols-2 gap-4">
          {/* Left Rear */}
          <HoofDiagram
            leg="LR"
            label={legLabels.LR}
            innerLesion={getLesionInfo("LR", "inner")}
            outerLesion={getLesionInfo("LR", "outer")}
          />
          {/* Right Rear */}
          <HoofDiagram
            leg="RR"
            label={legLabels.RR}
            innerLesion={getLesionInfo("RR", "inner")}
            outerLesion={getLesionInfo("RR", "outer")}
          />
        </div>

        <div className="text-center text-xs text-muted-foreground mt-2">REAR</div>
      </div>

      {/* Legend */}
      <div className="flex justify-center gap-4 text-xs">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-green-100 border border-green-300" />
          <span>Normal</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-yellow-100 border border-yellow-300" />
          <span>Mild</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-orange-100 border border-orange-300" />
          <span>Moderate</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-red-100 border border-red-300" />
          <span>Severe</span>
        </div>
      </div>
    </div>
  )
}

interface HoofDiagramProps {
  leg: string
  label: string
  innerLesion: { count: number; maxSeverity: number; lesions: Lesion[] } | null
  outerLesion: { count: number; maxSeverity: number; lesions: Lesion[] } | null
}

function HoofDiagram({ leg, label, innerLesion, outerLesion }: HoofDiagramProps) {
  const getSeverityColor = (severity: number | undefined) => {
    if (severity === undefined) return "bg-green-100 border-green-300"
    switch (severity) {
      case 0: return "bg-green-100 border-green-300"
      case 1: return "bg-yellow-100 border-yellow-300"
      case 2: return "bg-orange-100 border-orange-300"
      case 3: return "bg-red-100 border-red-300"
      default: return "bg-green-100 border-green-300"
    }
  }

  return (
    <div className="text-center">
      <div className="text-xs font-medium mb-1">{label}</div>
      <div className="flex justify-center gap-1">
        {/* Inner claw (medial) */}
        <div
          className={cn(
            "w-6 h-10 rounded-t-full border-2 cursor-pointer transition-colors",
            getSeverityColor(innerLesion?.maxSeverity)
          )}
          title={innerLesion ? `${innerLesion.count} lesion(s): ${innerLesion.lesions.map(l => l.type).join(', ')}` : 'No lesions'}
        >
          {innerLesion && innerLesion.count > 0 && (
            <div className="text-[10px] font-bold text-center mt-1">
              {innerLesion.count}
            </div>
          )}
        </div>
        {/* Outer claw (lateral) */}
        <div
          className={cn(
            "w-6 h-10 rounded-t-full border-2 cursor-pointer transition-colors",
            getSeverityColor(outerLesion?.maxSeverity)
          )}
          title={outerLesion ? `${outerLesion.count} lesion(s): ${outerLesion.lesions.map(l => l.type).join(', ')}` : 'No lesions'}
        >
          {outerLesion && outerLesion.count > 0 && (
            <div className="text-[10px] font-bold text-center mt-1">
              {outerLesion.count}
            </div>
          )}
        </div>
      </div>
      <div className="flex justify-center gap-1 text-[8px] text-muted-foreground mt-0.5">
        <span>In</span>
        <span>Out</span>
      </div>
    </div>
  )
}
