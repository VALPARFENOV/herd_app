"use client"

import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface TaskCounter {
  label: string
  count: number
  color: "red" | "yellow" | "green" | "blue"
  href: string
}

const colorClasses = {
  red: "bg-red-100 text-red-800 border-red-200",
  yellow: "bg-yellow-100 text-yellow-800 border-yellow-200",
  green: "bg-green-100 text-green-800 border-green-200",
  blue: "bg-blue-100 text-blue-800 border-blue-200",
}

const dotColors = {
  red: "bg-red-500",
  yellow: "bg-yellow-500",
  green: "bg-green-500",
  blue: "bg-blue-500",
}

interface TaskCountersProps {
  tasks: TaskCounter[]
}

export function TaskCounters({ tasks }: TaskCountersProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base font-medium">Tasks for Today</CardTitle>
        <Link
          href="/tasks"
          className="text-sm text-primary hover:underline"
        >
          View all
        </Link>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {tasks.map((task) => (
            <Link key={task.label} href={task.href}>
              <div
                className={cn(
                  "rounded-lg border p-4 text-center transition-colors hover:bg-accent/50 cursor-pointer",
                  colorClasses[task.color]
                )}
              >
                <div className="flex items-center justify-center gap-2 mb-2">
                  <span className={cn("h-2 w-2 rounded-full", dotColors[task.color])} />
                  <span className="text-sm font-medium">{task.label}</span>
                </div>
                <div className="text-2xl font-bold">{task.count}</div>
              </div>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
