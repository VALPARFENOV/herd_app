"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { LactationCurveChart } from "@/components/charts/lactation-curve-chart"
import type { AnimalWithComputed } from "@/lib/data/animals"
import type { EventWithDetails } from "@/lib/data/events"
import type { Lactation } from "@/types/database"

interface OverviewTabProps {
  animal: AnimalWithComputed
  events: EventWithDetails[]
  currentLactation: Lactation | null
}

export function OverviewTab({ animal, events, currentLactation }: OverviewTabProps) {
  const recentEvents = events.slice(0, 5)

  // Generate sample milk data based on current lactation
  // In production, this would come from milk_readings TimescaleDB table
  const generateSampleMilkData = () => {
    if (!currentLactation || !animal.dim || animal.dim === 0) return []

    // Wood's lactation curve with some variation
    const a = 35 + Math.random() * 10 // scale factor
    const b = 0.2 + Math.random() * 0.1 // rate to peak
    const c = 0.002 + Math.random() * 0.002 // decline rate

    const data = []
    const daysToSimulate = Math.min(animal.dim, 305)

    // Generate weekly data points
    for (let dim = 7; dim <= daysToSimulate; dim += 7) {
      const baseMilk = a * Math.pow(dim, b) * Math.exp(-c * dim)
      // Add some realistic variation
      const variation = (Math.random() - 0.5) * 4
      const milk_kg = Math.max(0, Math.round((baseMilk + variation) * 10) / 10)
      data.push({ dim, milk_kg })
    }

    return data
  }

  const milkData = generateSampleMilkData()

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Key Metrics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Last Milk (kg)</span>
              <span className="font-medium">{animal.last_milk_kg ?? "—"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Fat %</span>
              <span className="font-medium">{animal.last_fat_percent ?? "—"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Protein %</span>
              <span className="font-medium">{animal.last_protein_percent ?? "—"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">SCC (x1000)</span>
              <span className="font-medium">
                {animal.last_scc ? Math.round(animal.last_scc / 1000) : "—"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">BCS</span>
              <span className="font-medium">{animal.bcs_score ?? "—"}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recent Events</CardTitle>
        </CardHeader>
        <CardContent>
          {recentEvents.length === 0 ? (
            <div className="text-center text-muted-foreground py-4">
              No events recorded
            </div>
          ) : (
            <div className="space-y-4">
              {recentEvents.map((event) => (
                <div key={event.id} className="flex gap-4">
                  <div className="text-sm text-muted-foreground w-20">
                    {new Date(event.event_date).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })}
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-sm">{event.eventLabel}</div>
                    <div className="text-sm text-muted-foreground">
                      {event.eventDescription}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle className="text-base">Lactation Curve</CardTitle>
        </CardHeader>
        <CardContent>
          <LactationCurveChart
            data={milkData}
            me305Projection={currentLactation?.me_305_milk}
            showProjection={true}
          />
        </CardContent>
      </Card>
    </div>
  )
}
