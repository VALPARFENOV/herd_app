"use client"

import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { AlertTriangle, TrendingDown, Clock, Package } from "lucide-react"
import { cn } from "@/lib/utils"

interface Alert {
  id: string
  type: "milk_drop" | "overdue" | "inventory" | "health"
  message: string
  severity: "high" | "medium" | "low"
  animalId?: string
  timestamp?: string
}

const alertIcons = {
  milk_drop: TrendingDown,
  overdue: Clock,
  inventory: Package,
  health: AlertTriangle,
}

const severityColors = {
  high: "destructive",
  medium: "warning",
  low: "secondary",
} as const

interface AlertsListProps {
  alerts: Alert[]
}

export function AlertsList({ alerts }: AlertsListProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base font-medium flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-yellow-500" />
          Alerts
        </CardTitle>
        <Link
          href="/alerts"
          className="text-sm text-primary hover:underline"
        >
          View all
        </Link>
      </CardHeader>
      <CardContent>
        {alerts.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            No alerts
          </p>
        ) : (
          <div className="space-y-3">
            {alerts.map((alert) => {
              const Icon = alertIcons[alert.type]
              return (
                <div
                  key={alert.id}
                  className="flex items-start gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors cursor-pointer"
                >
                  <Icon className={cn(
                    "h-4 w-4 mt-0.5",
                    alert.severity === "high" && "text-red-500",
                    alert.severity === "medium" && "text-yellow-500",
                    alert.severity === "low" && "text-blue-500"
                  )} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm">{alert.message}</p>
                    {alert.animalId && (
                      <Link
                        href={`/animals/${alert.animalId}`}
                        className="text-xs text-primary hover:underline"
                      >
                        View animal
                      </Link>
                    )}
                  </div>
                  <Badge variant={severityColors[alert.severity]}>
                    {alert.severity}
                  </Badge>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
