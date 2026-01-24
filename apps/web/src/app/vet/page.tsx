import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { VetListTabs } from '@/components/vet/vet-list-tabs'
import {
  getFreshCheckList,
  getSickPenList,
  getScheduledExamsList,
  getActiveTreatmentsList,
  getVetListCounts,
} from '@/lib/data/vet-lists'
import { Activity, AlertTriangle, Calendar, Syringe } from 'lucide-react'

export default async function VetPage() {
  // Load all lists in parallel
  const [freshCheckList, sickPenList, scheduledExamsList, activeTreatmentsList, counts] =
    await Promise.all([
      getFreshCheckList(),
      getSickPenList(),
      getScheduledExamsList(),
      getActiveTreatmentsList(),
      getVetListCounts(),
    ])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Veterinary Management</h1>
        <p className="text-muted-foreground mt-2">
          Track fresh cows, treatments, and health interventions
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Fresh Check</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{counts.fresh_check}</div>
            <p className="text-xs text-muted-foreground">DIM 7-14 cows</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sick Pen</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{counts.sick_pen}</div>
            <p className="text-xs text-muted-foreground">Recent treatments</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Treatments</CardTitle>
            <Syringe className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{counts.active_treatments}</div>
            <p className="text-xs text-muted-foreground">Withdrawal active</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Scheduled Exams</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{counts.scheduled_exams}</div>
            <p className="text-xs text-muted-foreground">Upcoming</p>
          </CardContent>
        </Card>
      </div>

      {/* Vet Lists Tabs */}
      <Card>
        <CardHeader>
          <CardTitle>VetList Pro</CardTitle>
          <CardDescription>
            Manage veterinary tasks, treatments, and health monitoring
          </CardDescription>
        </CardHeader>
        <CardContent>
          <VetListTabs
            freshCheckList={freshCheckList}
            sickPenList={sickPenList}
            scheduledExamsList={scheduledExamsList}
            activeTreatmentsList={activeTreatmentsList}
            counts={counts}
          />
        </CardContent>
      </Card>
    </div>
  )
}
