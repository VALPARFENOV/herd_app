"use client"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

interface QuickFilter {
  label: string
  value: string
  count?: number
}

interface QuickFiltersProps {
  filters: QuickFilter[]
  activeFilter: string
  onFilterChange: (value: string) => void
}

export function QuickFilters({
  filters,
  activeFilter,
  onFilterChange,
}: QuickFiltersProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {filters.map((filter) => (
        <Button
          key={filter.value}
          variant={activeFilter === filter.value ? "default" : "outline"}
          size="sm"
          onClick={() => onFilterChange(filter.value)}
          className={cn(
            "transition-colors",
            activeFilter === filter.value && "bg-primary text-primary-foreground"
          )}
        >
          {filter.label}
          {filter.count !== undefined && (
            <span className="ml-1.5 text-xs opacity-70">({filter.count})</span>
          )}
        </Button>
      ))}
    </div>
  )
}
