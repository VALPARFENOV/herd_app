"use client"

import { Plus, CheckCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { HoofMap } from "./health/hoof-map"
import { UdderQuarterChart } from "./health/udder-quarter-chart"
import { AddEventDialog } from "@/components/events/add-event-dialog"
import type { AnimalWithComputed } from "@/lib/data/animals"
import type { EventWithDetails } from "@/lib/data/events"

interface HealthTabProps {
  animal: AnimalWithComputed
  events: EventWithDetails[]
}

export function HealthTab({ animal, events }: HealthTabProps) {
  const treatmentEvents = events.filter(e => ['treatment', 'vaccination'].includes(e.event_type))
  const hasActiveRestriction = false // TODO: Calculate from treatments with active withdrawal

  // Mock data for hooves and udder - will be replaced with real data from service provider tables
  const mockHoofInspections = [
    {
      date: "2024-12-15",
      locomotionScore: 2,
      lesions: [
        { leg: "RR", claw: "outer", zone: 1, type: "DD", severity: 2 },
        { leg: "RR", claw: "outer", zone: 2, type: "HHE", severity: 1 },
      ],
      treatment: "Hoof block + topical",
      inspector: "HoofCare Ltd",
    },
  ]

  const mockUdderTests = [
    { date: "2025-01-15", quarter: "LF", scc: 85, cmt: "-", pathogen: null },
    { date: "2025-01-15", quarter: "LR", scc: 92, cmt: "-", pathogen: null },
    { date: "2025-01-15", quarter: "RF", scc: 78, cmt: "-", pathogen: null },
    { date: "2025-01-15", quarter: "RR", scc: 110, cmt: "+", pathogen: null },
  ]

  const latestHoofInspection = mockHoofInspections[0]
  const sccDisplay = animal.last_scc ? Math.round(animal.last_scc / 1000) : null

  return (
    <div className="space-y-6">
      <Card className={hasActiveRestriction ? "border-red-200 bg-red-50" : "border-green-200 bg-green-50"}>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            {hasActiveRestriction ? (
              <>
                Active Restrictions
                <Badge variant="destructive">WITHDRAW</Badge>
              </>
            ) : (
              <>
                <CheckCircle className="h-4 w-4 text-green-600" />
                No Active Restrictions
              </>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            {hasActiveRestriction
              ? "Milk cannot be shipped to tank until withdrawal period ends"
              : "Milk can be shipped to tank"}
          </p>
        </CardContent>
      </Card>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="hooves">Hooves</TabsTrigger>
          <TabsTrigger value="udder">Udder</TabsTrigger>
          <TabsTrigger value="treatments">Treatments</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-4 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Current Health Metrics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-4">
                <div className="space-y-1">
                  <div className="text-sm text-muted-foreground">BCS</div>
                  <div className="flex items-center gap-2">
                    <span className="text-xl font-bold">{animal.bcs_score ?? "—"}</span>
                    {animal.bcs_score && animal.bcs_score >= 2.75 && animal.bcs_score <= 3.5 && (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground">Normal: 2.75-3.50</div>
                </div>
                <div className="space-y-1">
                  <div className="text-sm text-muted-foreground">SCC</div>
                  <div className="flex items-center gap-2">
                    <span className="text-xl font-bold">
                      {sccDisplay !== null ? `${sccDisplay}K` : "—"}
                    </span>
                    {sccDisplay !== null && sccDisplay < 200 && (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground">Normal: &lt;200K</div>
                </div>
                <div className="space-y-1">
                  <div className="text-sm text-muted-foreground">Locomotion</div>
                  <div className="flex items-center gap-2">
                    <span className="text-xl font-bold">{latestHoofInspection?.locomotionScore ?? "—"}</span>
                    {latestHoofInspection?.locomotionScore && latestHoofInspection.locomotionScore <= 2 && (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground">Normal: 1-2</div>
                </div>
                <div className="space-y-1">
                  <div className="text-sm text-muted-foreground">Last Exam</div>
                  <div className="text-xl font-bold">
                    {animal.last_vet_check_date
                      ? new Date(animal.last_vet_check_date).toLocaleDateString()
                      : "—"}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="hooves" className="mt-4 space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Hoof Health</h3>
            <Button size="sm">
              <Plus className="mr-2 h-4 w-4" />
              Add Inspection
            </Button>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Latest Inspection</CardTitle>
              </CardHeader>
              <CardContent>
                <HoofMap
                  lesions={latestHoofInspection?.lesions || []}
                  date={latestHoofInspection?.date}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Inspection Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {latestHoofInspection ? (
                  <>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Date:</span>
                        <span className="ml-2 font-medium">{latestHoofInspection.date}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Locomotion:</span>
                        <span className="ml-2 font-medium">{latestHoofInspection.locomotionScore}/5</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Inspector:</span>
                        <span className="ml-2 font-medium">{latestHoofInspection.inspector}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Treatment:</span>
                        <span className="ml-2 font-medium">{latestHoofInspection.treatment}</span>
                      </div>
                    </div>
                    {latestHoofInspection.lesions.length > 0 && (
                      <div>
                        <div className="text-sm font-medium mb-2">Lesions Found:</div>
                        <div className="space-y-1">
                          {latestHoofInspection.lesions.map((lesion, idx) => (
                            <div key={idx} className="text-sm flex items-center gap-2">
                              <Badge variant={lesion.severity >= 2 ? "destructive" : "warning"}>
                                {lesion.type}
                              </Badge>
                              <span>{lesion.leg} {lesion.claw} - Zone {lesion.zone}</span>
                              <span className="text-muted-foreground">(Severity {lesion.severity}/3)</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-center text-muted-foreground py-4">
                    No inspection data
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="udder" className="mt-4 space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Udder Health</h3>
            <Button size="sm">
              <Plus className="mr-2 h-4 w-4" />
              Add Test
            </Button>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">SCC by Quarter</CardTitle>
              </CardHeader>
              <CardContent>
                <UdderQuarterChart data={mockUdderTests} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Latest Results</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Quarter</TableHead>
                      <TableHead>SCC (K)</TableHead>
                      <TableHead>CMT</TableHead>
                      <TableHead>Pathogen</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {mockUdderTests.map((test, idx) => (
                      <TableRow key={idx}>
                        <TableCell className="font-medium">{test.quarter}</TableCell>
                        <TableCell>
                          <Badge variant={test.scc < 200 ? "success" : "warning"}>
                            {test.scc}
                          </Badge>
                        </TableCell>
                        <TableCell>{test.cmt}</TableCell>
                        <TableCell>{test.pathogen || "—"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="treatments" className="mt-4 space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Treatments</h3>
            <AddEventDialog
              animalId={animal.id}
              animalEarTag={animal.ear_tag}
              defaultEventType="treatment"
              trigger={
                <Button size="sm">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Treatment
                </Button>
              }
            />
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Treatment History</CardTitle>
            </CardHeader>
            <CardContent>
              {treatmentEvents.length === 0 ? (
                <div className="text-center text-muted-foreground py-4">
                  No treatments recorded
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Details</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {treatmentEvents.map((event) => (
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
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
