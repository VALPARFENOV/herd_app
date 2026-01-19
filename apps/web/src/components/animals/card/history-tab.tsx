"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import type { EventWithDetails } from "@/lib/data/events"

interface HistoryTabProps {
  events: EventWithDetails[]
}

const eventTypeColors: Record<string, string> = {
  calving: "bg-emerald-500",
  breeding: "bg-blue-500",
  heat: "bg-pink-500",
  pregnancy_check: "bg-indigo-500",
  dry_off: "bg-gray-500",
  treatment: "bg-red-500",
  vaccination: "bg-purple-500",
  bcs: "bg-amber-500",
  sold: "bg-slate-500",
  culled: "bg-slate-500",
  dead: "bg-slate-500",
}

export function HistoryTab({ events }: HistoryTabProps) {
  // Group events by year and month
  const groupedEvents = events.reduce((acc, event) => {
    const date = new Date(event.event_date)
    const yearMonth = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`
    if (!acc[yearMonth]) {
      acc[yearMonth] = []
    }
    acc[yearMonth].push(event)
    return acc
  }, {} as Record<string, EventWithDetails[]>)

  const sortedYearMonths = Object.keys(groupedEvents).sort().reverse()

  if (events.length === 0) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="text-center text-muted-foreground">
            No events recorded for this animal
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Complete Event Timeline</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-border" />

            <div className="space-y-8">
              {sortedYearMonths.map((yearMonth) => {
                const [year, month] = yearMonth.split("-")
                const monthName = new Date(parseInt(year), parseInt(month) - 1).toLocaleDateString("en-US", {
                  month: "long",
                  year: "numeric",
                })

                return (
                  <div key={yearMonth}>
                    <div className="relative mb-4">
                      <div className="absolute left-0 w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                        <span className="text-xs text-primary-foreground font-medium">
                          {month}
                        </span>
                      </div>
                      <h3 className="ml-12 text-sm font-semibold text-muted-foreground">
                        {monthName}
                      </h3>
                    </div>

                    <div className="space-y-3">
                      {groupedEvents[yearMonth].map((event) => (
                        <div key={event.id} className="relative flex gap-4">
                          <div className="absolute left-4 top-2 w-1.5 h-1.5 rounded-full bg-border -translate-x-1/2" />
                          <div className="ml-12 flex-1 bg-muted/50 rounded-lg p-3">
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <div className="flex items-center gap-2">
                                  <Badge
                                    variant="secondary"
                                    className={`${eventTypeColors[event.event_type] || "bg-gray-500"} text-white`}
                                  >
                                    {event.eventLabel}
                                  </Badge>
                                  <span className="text-sm text-muted-foreground">
                                    {new Date(event.event_date).toLocaleDateString("en-US", {
                                      day: "numeric",
                                      month: "short",
                                    })}
                                  </span>
                                </div>
                                <p className="mt-1 text-sm">{event.eventDescription}</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="text-sm text-muted-foreground text-center">
        Showing {events.length} event{events.length !== 1 ? "s" : ""}
      </div>
    </div>
  )
}
