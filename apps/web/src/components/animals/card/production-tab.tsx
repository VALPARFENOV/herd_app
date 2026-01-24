"use client"

import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { AddMilkReadingDialog } from "./health/add-milk-reading-dialog"
import type { AnimalWithComputed } from "@/lib/data/animals"
import type { Lactation } from "@/types/database"

interface ProductionTabProps {
  animal: AnimalWithComputed
  lactations: Lactation[]
  currentLactation: Lactation | null
}

function calculateAge(birthDate: string, targetDate: string): string {
  const birth = new Date(birthDate)
  const target = new Date(targetDate)
  const years = target.getFullYear() - birth.getFullYear()
  const months = target.getMonth() - birth.getMonth()
  const adjustedMonths = months < 0 ? 12 + months : months
  const adjustedYears = months < 0 ? years - 1 : years
  return `${adjustedYears}y ${adjustedMonths}m`
}

export function ProductionTab({ animal, lactations, currentLactation }: ProductionTabProps) {
  const completedLactations = lactations.filter(l => l.dry_date !== null)

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">Milk Production</h3>
        <AddMilkReadingDialog
          animalId={animal.id}
          animalEarTag={animal.ear_tag}
          trigger={
            <Button size="sm">
              <Plus className="mr-2 h-4 w-4" />
              Add Milk Reading
            </Button>
          }
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Current Lactation (#{animal.lactation_number})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="text-center p-4 bg-muted rounded-lg">
              <div className="text-2xl font-bold">
                {currentLactation?.total_milk_kg
                  ? Math.round(currentLactation.total_milk_kg).toLocaleString()
                  : "—"} kg
              </div>
              <div className="text-sm text-muted-foreground">
                Total ({animal.dim ?? 0} days)
              </div>
            </div>
            <div className="text-center p-4 bg-muted rounded-lg">
              <div className="text-2xl font-bold">{animal.last_milk_kg ?? "—"} kg</div>
              <div className="text-sm text-muted-foreground">Last Test Day</div>
            </div>
            <div className="text-center p-4 bg-muted rounded-lg">
              <div className="text-2xl font-bold">
                {currentLactation?.me_305_milk
                  ? currentLactation.me_305_milk.toLocaleString()
                  : "—"} kg
              </div>
              <div className="text-sm text-muted-foreground">305ME Projection</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Lactation Curve</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-48 flex items-center justify-center text-muted-foreground border rounded-md">
            Interactive lactation curve chart placeholder
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Current Lactation Details</CardTitle>
        </CardHeader>
        <CardContent>
          {currentLactation ? (
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Peak Milk</span>
                  <span className="font-medium">{currentLactation.peak_milk_kg ?? "—"} kg</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Peak DIM</span>
                  <span className="font-medium">{currentLactation.peak_dim ?? "—"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Avg Fat %</span>
                  <span className="font-medium">{currentLactation.avg_fat_percent ?? "—"}</span>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Avg Protein %</span>
                  <span className="font-medium">{currentLactation.avg_protein_percent ?? "—"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Avg SCC</span>
                  <span className="font-medium">
                    {currentLactation.avg_scc ? `${Math.round(currentLactation.avg_scc / 1000)}K` : "—"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Days in Milk</span>
                  <span className="font-medium">{currentLactation.days_in_milk ?? animal.dim ?? "—"}</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center text-muted-foreground py-4">
              No current lactation data
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Completed Lactations</CardTitle>
        </CardHeader>
        <CardContent>
          {completedLactations.length === 0 ? (
            <div className="text-center text-muted-foreground py-4">
              No completed lactations
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>L#</TableHead>
                  <TableHead>Age</TableHead>
                  <TableHead className="text-center">Milk Days</TableHead>
                  <TableHead className="text-right">Total (kg)</TableHead>
                  <TableHead className="text-right">305ME</TableHead>
                  <TableHead className="text-right">Peak</TableHead>
                  <TableHead className="text-right">Avg SCC</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {completedLactations.map((lact) => (
                  <TableRow key={lact.id}>
                    <TableCell>{lact.lactation_number}</TableCell>
                    <TableCell>{calculateAge(animal.birth_date, lact.calving_date)}</TableCell>
                    <TableCell className="text-center">{lact.days_in_milk ?? "—"}</TableCell>
                    <TableCell className="text-right">
                      {lact.total_milk_kg ? lact.total_milk_kg.toLocaleString() : "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      {lact.me_305_milk ? lact.me_305_milk.toLocaleString() : "—"}
                    </TableCell>
                    <TableCell className="text-right">{lact.peak_milk_kg ?? "—"}</TableCell>
                    <TableCell className="text-right">
                      {lact.avg_scc ? `${Math.round(lact.avg_scc / 1000)}K` : "—"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
