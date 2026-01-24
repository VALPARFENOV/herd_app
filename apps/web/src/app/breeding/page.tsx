import {
  getToBreedList,
  getPregCheckList,
  getDryOffList,
  getFreshCowsList,
  getBreedingListCounts,
} from '@/lib/data/breeding-lists'
import { BreedingListTabs } from '@/components/breeding/breeding-list-tabs'

export default async function BreedingPage() {
  const [toBreedList, pregCheckList, dryOffList, freshList, counts] = await Promise.all([
    getToBreedList(),
    getPregCheckList(),
    getDryOffList(),
    getFreshCowsList(),
    getBreedingListCounts(),
  ])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Breeding Management</h1>
        <p className="text-muted-foreground">
          Manage breeding, pregnancy checks, and dry off schedules
        </p>
      </div>

      <BreedingListTabs
        toBreedList={toBreedList}
        pregCheckList={pregCheckList}
        dryOffList={dryOffList}
        freshList={freshList}
        counts={counts}
      />
    </div>
  )
}
