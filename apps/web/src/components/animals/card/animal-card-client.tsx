"use client"

import Link from "next/link"
import { ArrowLeft, Camera, Edit } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { OverviewTab } from "./overview-tab"
import { ReproductionTab } from "./reproduction-tab"
import { ProductionTab } from "./production-tab"
import { HealthTab } from "./health-tab"
import { HistoryTab } from "./history-tab"
import type { AnimalCardData } from "@/lib/data/animal-card"

interface AnimalCardClientProps {
  data: AnimalCardData
}

function getReproStatusBadge(animal: AnimalCardData['animal']) {
  const { rc, days_carried, expected_calving_date } = animal

  switch (rc) {
    case 'PREG':
      return (
        <Badge variant="success" className="text-sm">
          PREGNANT {days_carried ? `(${days_carried} days)` : ''}
        </Badge>
      )
    case 'BRED':
      return <Badge variant="info" className="text-sm">BRED</Badge>
    case 'FRESH':
      return <Badge variant="success" className="text-sm">FRESH</Badge>
    case 'OPEN':
      return <Badge variant="warning" className="text-sm">OPEN</Badge>
    case 'DRY':
      return <Badge variant="secondary" className="text-sm">DRY</Badge>
    case 'HEIFER':
      return <Badge variant="secondary" className="text-sm">HEIFER</Badge>
    default:
      return <Badge variant="secondary" className="text-sm">{rc}</Badge>
  }
}

export function AnimalCardClient({ data }: AnimalCardClientProps) {
  const { animal, events, lactations, currentLactation, hoofInspections, udderTestSessions } = data

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/animals">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <span className="text-muted-foreground">Back to list</span>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        <div className="flex-shrink-0">
          <div className="relative w-32 h-32 rounded-lg border bg-muted overflow-hidden">
            <Avatar className="w-full h-full rounded-none">
              <AvatarImage src={animal.photo_url || undefined} alt={animal.name || animal.ear_tag} />
              <AvatarFallback className="rounded-none text-3xl">
                {animal.ear_tag.slice(0, 2)}
              </AvatarFallback>
            </Avatar>
            <Button
              variant="secondary"
              size="icon"
              className="absolute bottom-2 right-2 h-8 w-8"
            >
              <Camera className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold">
              #{animal.ear_tag} {animal.name || ''}
            </h1>
            <Link href={`/animals/${animal.id}/edit`}>
              <Button variant="outline" size="sm">
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </Button>
            </Link>
          </div>
          <p className="text-muted-foreground">
            {animal.breed} | Lactation {animal.lactation_number} | DIM: {animal.dim ?? '—'}
          </p>
          <p className="text-muted-foreground">
            Pen: {animal.pen_name || '—'}
          </p>
          <div className="flex items-center gap-2 pt-2">
            {getReproStatusBadge(animal)}
            {animal.expected_calving_date && (
              <span className="text-sm text-muted-foreground">
                Expected calving: {new Date(animal.expected_calving_date).toLocaleDateString()}
              </span>
            )}
          </div>
        </div>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="reproduction">Reproduction</TabsTrigger>
          <TabsTrigger value="production">Production</TabsTrigger>
          <TabsTrigger value="health">Health</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6">
          <OverviewTab animal={animal} events={events} currentLactation={currentLactation} />
        </TabsContent>

        <TabsContent value="reproduction" className="mt-6">
          <ReproductionTab animal={animal} events={events} />
        </TabsContent>

        <TabsContent value="production" className="mt-6">
          <ProductionTab animal={animal} lactations={lactations} currentLactation={currentLactation} />
        </TabsContent>

        <TabsContent value="health" className="mt-6">
          <HealthTab animal={animal} events={events} hoofInspections={hoofInspections} udderTestSessions={udderTestSessions} />
        </TabsContent>

        <TabsContent value="history" className="mt-6">
          <HistoryTab events={events} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
