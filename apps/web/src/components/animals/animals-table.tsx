"use client"

import Link from "next/link"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import type { AnimalWithComputed } from "@/lib/data/animals"

const rcBadgeVariants: Record<string, "default" | "secondary" | "success" | "warning" | "info"> = {
  FRESH: "success",
  OK: "success",
  OPEN: "warning",
  BRED: "info",
  PREG: "default",
  DRY: "secondary",
  HEIFER: "secondary",
}

interface AnimalsTableProps {
  animals: AnimalWithComputed[]
}

export function AnimalsTable({ animals }: AnimalsTableProps) {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[100px]">ID</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Pen</TableHead>
            <TableHead className="text-center">Lact</TableHead>
            <TableHead className="text-center">DIM</TableHead>
            <TableHead className="text-right">Milk (kg)</TableHead>
            <TableHead>RC</TableHead>
            <TableHead className="text-center">Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {animals.length === 0 ? (
            <TableRow>
              <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                No animals found
              </TableCell>
            </TableRow>
          ) : (
            animals.map((animal) => (
              <TableRow key={animal.id}>
                <TableCell className="font-medium">
                  <Link
                    href={`/animals/${animal.id}`}
                    className="text-primary hover:underline"
                  >
                    {animal.ear_tag}
                  </Link>
                </TableCell>
                <TableCell>{animal.name || "—"}</TableCell>
                <TableCell>{animal.pen_name || "—"}</TableCell>
                <TableCell className="text-center">{animal.lactation_number}</TableCell>
                <TableCell className="text-center">{animal.dim ?? "—"}</TableCell>
                <TableCell className="text-right">
                  {animal.last_milk_kg !== null ? animal.last_milk_kg.toFixed(1) : "—"}
                </TableCell>
                <TableCell>
                  <Badge variant={rcBadgeVariants[animal.rc] || "secondary"}>
                    {animal.rc}
                  </Badge>
                </TableCell>
                <TableCell className="text-center">
                  <span
                    className={cn(
                      "inline-block h-2 w-2 rounded-full",
                      animal.displayStatus === "active" && "bg-green-500",
                      animal.displayStatus === "attention" && "bg-yellow-500",
                      animal.displayStatus === "alert" && "bg-red-500"
                    )}
                  />
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  )
}
