"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { VetTable } from "./vet-table"
import { AddEventDialog } from "@/components/events/add-event-dialog"
import type { VetListAnimal } from "@/lib/data/vet-lists"

interface VetListTabsProps {
  freshCheckList: VetListAnimal[]
  sickPenList: VetListAnimal[]
  scheduledExamsList: VetListAnimal[]
  activeTreatmentsList: VetListAnimal[]
  counts: {
    fresh_check: number
    sick_pen: number
    scheduled_exams: number
    active_treatments: number
  }
}

export function VetListTabs({
  freshCheckList,
  sickPenList,
  scheduledExamsList,
  activeTreatmentsList,
  counts,
}: VetListTabsProps) {
  const [selectedAnimal, setSelectedAnimal] = useState<{
    id: string
    earTag: string
    eventType: 'treatment' | 'vaccination'
  } | null>(null)

  const handleAction = (
    animalId: string,
    animalEarTag: string,
    actionType: 'exam' | 'treatment'
  ) => {
    setSelectedAnimal({
      id: animalId,
      earTag: animalEarTag,
      eventType: 'treatment',
    })
  }

  return (
    <>
      <Tabs defaultValue="fresh_check" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="fresh_check" className="relative">
            Fresh Check
            {counts.fresh_check > 0 && (
              <Badge variant="secondary" className="ml-2">
                {counts.fresh_check}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="sick_pen" className="relative">
            Sick Pen
            {counts.sick_pen > 0 && (
              <Badge variant="destructive" className="ml-2">
                {counts.sick_pen}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="active_treatments" className="relative">
            Active Treatments
            {counts.active_treatments > 0 && (
              <Badge variant="outline" className="ml-2">
                {counts.active_treatments}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="scheduled" className="relative">
            Scheduled Exams
            {counts.scheduled_exams > 0 && (
              <Badge variant="outline" className="ml-2">
                {counts.scheduled_exams}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="fresh_check" className="mt-6">
          <div className="mb-4">
            <p className="text-sm text-muted-foreground">
              Fresh cows requiring veterinary check (DIM 7-14). Examine for metritis, ketosis, and
              other fresh cow issues.
            </p>
          </div>
          <VetTable
            animals={freshCheckList}
            type="fresh_check"
            onAction={(id) => {
              const animal = freshCheckList.find((a) => a.id === id)
              if (animal) handleAction(id, animal.ear_tag, 'exam')
            }}
          />
        </TabsContent>

        <TabsContent value="sick_pen" className="mt-6">
          <div className="mb-4">
            <p className="text-sm text-muted-foreground">
              Animals with recent treatments or health issues requiring monitoring.
            </p>
          </div>
          <VetTable
            animals={sickPenList}
            type="sick_pen"
            onAction={(id) => {
              const animal = sickPenList.find((a) => a.id === id)
              if (animal) handleAction(id, animal.ear_tag, 'treatment')
            }}
          />
        </TabsContent>

        <TabsContent value="active_treatments" className="mt-6">
          <div className="mb-4 bg-amber-50 border border-amber-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <div className="text-amber-600 mt-0.5">⚠️</div>
              <div>
                <h4 className="font-medium text-amber-900">Active Withdrawal Periods</h4>
                <p className="text-sm text-amber-700 mt-1">
                  These animals are under active withdrawal. Do not ship milk until withdrawal
                  period ends.
                </p>
              </div>
            </div>
          </div>
          <VetTable
            animals={activeTreatmentsList}
            type="active_treatments"
            onAction={(id) => {
              const animal = activeTreatmentsList.find((a) => a.id === id)
              if (animal) handleAction(id, animal.ear_tag, 'treatment')
            }}
          />
        </TabsContent>

        <TabsContent value="scheduled" className="mt-6">
          <div className="mb-4">
            <p className="text-sm text-muted-foreground">
              Scheduled veterinary exams and procedures.
            </p>
          </div>
          <VetTable
            animals={scheduledExamsList}
            type="scheduled"
            onAction={(id) => {
              const animal = scheduledExamsList.find((a) => a.id === id)
              if (animal) handleAction(id, animal.ear_tag, 'exam')
            }}
          />
        </TabsContent>
      </Tabs>

      {selectedAnimal && (
        <AddEventDialog
          animalId={selectedAnimal.id}
          animalEarTag={selectedAnimal.earTag}
          defaultEventType={selectedAnimal.eventType}
          open={!!selectedAnimal}
          onOpenChange={(open) => {
            if (!open) setSelectedAnimal(null)
          }}
        />
      )}
    </>
  )
}
