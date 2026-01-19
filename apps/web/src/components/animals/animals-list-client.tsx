"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
import { Plus, Search, SlidersHorizontal, Columns } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { AnimalsTable } from "./animals-table"
import { QuickFilters } from "./quick-filters"
import type { AnimalWithComputed } from "@/lib/data/animals"

interface AnimalsListClientProps {
  animals: AnimalWithComputed[]
  stats: {
    total: number
    milking: number
    dry: number
    fresh: number
    heifers: number
    attention: number
  }
}

export function AnimalsListClient({ animals, stats }: AnimalsListClientProps) {
  const [search, setSearch] = useState("")
  const [activeFilter, setActiveFilter] = useState("all")

  const quickFilters = [
    { label: "All", value: "all", count: stats.total },
    { label: "Milking", value: "milking", count: stats.milking },
    { label: "Dry", value: "dry", count: stats.dry },
    { label: "Heifers", value: "heifers", count: stats.heifers },
    { label: "Attention", value: "attention", count: stats.attention },
  ]

  const filteredAnimals = useMemo(() => {
    return animals.filter((animal) => {
      const matchesSearch =
        search === "" ||
        animal.ear_tag.toLowerCase().includes(search.toLowerCase()) ||
        animal.name?.toLowerCase().includes(search.toLowerCase())

      const matchesFilter =
        activeFilter === "all" ||
        (activeFilter === "milking" && animal.rc !== "DRY" && animal.current_status !== "heifer") ||
        (activeFilter === "dry" && animal.current_status === "dry") ||
        (activeFilter === "heifers" && animal.current_status === "heifer") ||
        (activeFilter === "attention" && animal.displayStatus !== "active")

      return matchesSearch && matchesFilter
    })
  }, [animals, search, activeFilter])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Animals</h1>
          <p className="text-muted-foreground">Manage your herd</p>
        </div>
        <Link href="/animals/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Animal
          </Button>
        </Link>
      </div>

      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by ID or name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8"
            />
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="icon">
              <SlidersHorizontal className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon">
              <Columns className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <QuickFilters
          filters={quickFilters}
          activeFilter={activeFilter}
          onFilterChange={setActiveFilter}
        />
      </div>

      <AnimalsTable animals={filteredAnimals} />

      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <div>Showing {filteredAnimals.length} of {animals.length} animals</div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" disabled>
            Previous
          </Button>
          <Button variant="outline" size="sm">
            Next
          </Button>
        </div>
      </div>
    </div>
  )
}
