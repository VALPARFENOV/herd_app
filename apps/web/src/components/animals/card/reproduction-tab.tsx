"use client"

import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { AddEventDialog } from "@/components/events/add-event-dialog"
import type { AnimalWithComputed } from "@/lib/data/animals"
import type { EventWithDetails } from "@/lib/data/events"

interface ReproductionTabProps {
  animal: AnimalWithComputed
  events: EventWithDetails[]
}

function getReproStatusBadge(rc: string) {
  switch (rc) {
    case 'PREG':
      return <Badge variant="success">PREGNANT</Badge>
    case 'BRED':
      return <Badge variant="info">BRED</Badge>
    case 'FRESH':
      return <Badge variant="success">FRESH</Badge>
    case 'OPEN':
      return <Badge variant="warning">OPEN</Badge>
    case 'DRY':
      return <Badge variant="secondary">DRY</Badge>
    case 'HEIFER':
      return <Badge variant="secondary">HEIFER</Badge>
    default:
      return <Badge variant="secondary">{rc}</Badge>
  }
}

export function ReproductionTab({ animal, events }: ReproductionTabProps) {
  const daysToCalving = animal.expected_calving_date
    ? Math.ceil(
        (new Date(animal.expected_calving_date).getTime() - new Date().getTime()) /
          (1000 * 60 * 60 * 24)
      )
    : null

  const recommendedDryOff = daysToCalving !== null && daysToCalving > 60
    ? daysToCalving - 60
    : null

  const breedingEvents = events
    .filter(e => ['breeding', 'heat', 'pregnancy_check'].includes(e.event_type))
    .slice(0, 10)

  const breedingCount = breedingEvents.filter(e => e.event_type === 'breeding').length

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">Reproduction</h2>
        <AddEventDialog
          animalId={animal.id}
          animalEarTag={animal.ear_tag}
          trigger={
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Event
            </Button>
          }
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            Current Status
            {getReproStatusBadge(animal.rc)}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Breeding Date</span>
                <span className="font-medium">
                  {animal.last_breeding_date
                    ? new Date(animal.last_breeding_date).toLocaleDateString()
                    : "—"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Last Heat</span>
                <span className="font-medium">
                  {animal.last_heat_date
                    ? new Date(animal.last_heat_date).toLocaleDateString()
                    : "—"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Days Pregnant</span>
                <span className="font-medium">{animal.days_carried ?? "—"}</span>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Expected Calving</span>
                <span className="font-medium">
                  {animal.expected_calving_date
                    ? new Date(animal.expected_calving_date).toLocaleDateString()
                    : "—"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Days to Calving</span>
                <span className="font-medium">
                  {daysToCalving !== null ? daysToCalving : "—"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Recommended Dry-Off</span>
                <span className="font-medium">
                  {recommendedDryOff !== null && recommendedDryOff > 0
                    ? `In ${recommendedDryOff} days`
                    : "—"}
                </span>
              </div>
            </div>
          </div>
          {animal.rc === 'PREG' && animal.current_status !== 'dry' && (
            <div className="mt-4">
              <AddEventDialog
                animalId={animal.id}
                animalEarTag={animal.ear_tag}
                defaultEventType="dry_off"
                trigger={<Button variant="outline">Register Dry-Off</Button>}
              />
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Breeding History (Current Lactation)</CardTitle>
        </CardHeader>
        <CardContent>
          {breedingEvents.length === 0 ? (
            <div className="text-center text-muted-foreground py-4">
              No breeding events recorded
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Details</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {breedingEvents.map((event) => (
                    <TableRow key={event.id}>
                      <TableCell>
                        {new Date(event.event_date).toLocaleDateString()}
                      </TableCell>
                      <TableCell>{event.eventLabel}</TableCell>
                      <TableCell>{event.eventDescription}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {breedingCount > 0 && (
                <div className="mt-4 text-sm text-muted-foreground">
                  Breeding Index: {breedingCount}.0 | Breedings this lactation: {breedingCount}
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Pedigree</CardTitle>
          <Button variant="link" size="sm">
            Details
          </Button>
        </CardHeader>
        <CardContent>
          <div className="text-sm space-y-2 font-mono">
            <div className="flex gap-4">
              <span className="text-muted-foreground w-16">Sire:</span>
              <span>{animal.sire_registration || "—"}</span>
            </div>
            <div className="flex gap-4">
              <span className="text-muted-foreground w-16">Dam:</span>
              <span>{animal.dam_registration || "—"}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
