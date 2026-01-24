"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { BreedingTable } from "./breeding-table"
import { AddEventDialog } from "@/components/events/add-event-dialog"
import type { BreedingListAnimal } from "@/lib/data/breeding-lists"

interface BreedingListTabsProps {
  toBreedList: BreedingListAnimal[]
  pregCheckList: BreedingListAnimal[]
  dryOffList: BreedingListAnimal[]
  freshList: BreedingListAnimal[]
  counts: {
    toBreed: number
    pregCheck: number
    dryOff: number
    fresh: number
  }
}

export function BreedingListTabs({
  toBreedList,
  pregCheckList,
  dryOffList,
  freshList,
  counts,
}: BreedingListTabsProps) {
  const [selectedAnimal, setSelectedAnimal] = useState<{
    id: string
    earTag: string
    eventType: 'breeding' | 'pregnancy_check' | 'dry_off'
  } | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  const handleAction = (animalId: string, eventType: 'breeding' | 'preg_check' | 'dry_off') => {
    const animal =
      eventType === 'breeding'
        ? toBreedList.find((a) => a.id === animalId)
        : eventType === 'preg_check'
        ? pregCheckList.find((a) => a.id === animalId)
        : dryOffList.find((a) => a.id === animalId)

    if (animal) {
      // Map preg_check to pregnancy_check for the dialog
      const dialogEventType =
        eventType === 'preg_check' ? 'pregnancy_check' : (eventType as 'breeding' | 'pregnancy_check' | 'dry_off')

      setSelectedAnimal({
        id: animal.id,
        earTag: animal.ear_tag,
        eventType: dialogEventType,
      })
      setIsDialogOpen(true)
    }
  }

  return (
    <>
      <Tabs defaultValue="to_breed" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="to_breed" className="relative">
            To Breed
            {counts.toBreed > 0 && (
              <Badge variant="secondary" className="ml-2">
                {counts.toBreed}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="preg_check" className="relative">
            Preg Check
            {counts.pregCheck > 0 && (
              <Badge variant="secondary" className="ml-2">
                {counts.pregCheck}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="dry_off" className="relative">
            Dry Off
            {counts.dryOff > 0 && (
              <Badge variant="secondary" className="ml-2">
                {counts.dryOff}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="fresh" className="relative">
            Fresh Cows
            {counts.fresh > 0 && (
              <Badge variant="secondary" className="ml-2">
                {counts.fresh}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="to_breed" className="mt-6">
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold">Cows Ready to Breed</h3>
              <p className="text-sm text-muted-foreground">
                Open cows past 60 DIM or in heat detection
              </p>
            </div>
            <BreedingTable
              animals={toBreedList}
              type="to_breed"
              onAction={(id) => handleAction(id, 'breeding')}
            />
          </div>
        </TabsContent>

        <TabsContent value="preg_check" className="mt-6">
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold">Pregnancy Check Due</h3>
              <p className="text-sm text-muted-foreground">
                Bred cows 35-45 days after last breeding
              </p>
            </div>
            <BreedingTable
              animals={pregCheckList}
              type="preg_check"
              onAction={(id) => handleAction(id, 'preg_check')}
            />
          </div>
        </TabsContent>

        <TabsContent value="dry_off" className="mt-6">
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold">Cows Ready to Dry Off</h3>
              <p className="text-sm text-muted-foreground">
                Pregnant cows with expected calving within 60 days
              </p>
            </div>
            <BreedingTable
              animals={dryOffList}
              type="dry_off"
              onAction={(id) => handleAction(id, 'dry_off')}
            />
          </div>
        </TabsContent>

        <TabsContent value="fresh" className="mt-6">
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold">Fresh Cows</h3>
              <p className="text-sm text-muted-foreground">
                Cows with less than 21 days in milk
              </p>
            </div>
            <BreedingTable animals={freshList} type="fresh" />
          </div>
        </TabsContent>
      </Tabs>

      {selectedAnimal && (
        <AddEventDialog
          open={isDialogOpen}
          onOpenChange={setIsDialogOpen}
          animalId={selectedAnimal.id}
          animalEarTag={selectedAnimal.earTag}
          defaultEventType={selectedAnimal.eventType}
        />
      )}
    </>
  )
}
