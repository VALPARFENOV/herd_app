import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { LucideIcon } from "lucide-react"

interface StatCardProps {
  title: string
  value: string | number
  subtitle?: string
  change?: {
    value: string
    trend: "up" | "down" | "neutral"
  }
  icon?: LucideIcon
  className?: string
}

export function StatCard({
  title,
  value,
  subtitle,
  change,
  icon: Icon,
  className,
}: StatCardProps) {
  return (
    <Card className={cn("", className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        {Icon && <Icon className="h-4 w-4 text-muted-foreground" />}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {subtitle && (
          <p className="text-xs text-muted-foreground">{subtitle}</p>
        )}
        {change && (
          <p
            className={cn(
              "text-xs mt-1",
              change.trend === "up" && "text-green-600",
              change.trend === "down" && "text-red-600",
              change.trend === "neutral" && "text-muted-foreground"
            )}
          >
            {change.trend === "up" && "+"}{change.value}
          </p>
        )}
      </CardContent>
    </Card>
  )
}
