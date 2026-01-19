import { createClient } from '@/lib/supabase/server'
import { getAnimalStats } from './animals'

export interface DashboardStats {
  totalHerd: number
  milking: number
  dry: number
  heifers: number
  distribution: {
    label: string
    value: number
    percentage: number
    color: string
  }[]
}

export interface DashboardTask {
  label: string
  count: number
  color: 'red' | 'yellow' | 'green' | 'blue'
  href: string
}

export interface DashboardAlert {
  id: string
  type: 'milk_drop' | 'overdue' | 'health' | 'inventory'
  message: string
  severity: 'high' | 'medium' | 'low'
  animalId?: string
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const stats = await getAnimalStats()

  const distribution = [
    {
      label: 'Milking',
      value: stats.milking,
      percentage: stats.total > 0 ? Math.round((stats.milking / stats.total) * 100) : 0,
      color: '#22c55e',
    },
    {
      label: 'Dry',
      value: stats.dry,
      percentage: stats.total > 0 ? Math.round((stats.dry / stats.total) * 100) : 0,
      color: '#3b82f6',
    },
    {
      label: 'Heifers',
      value: stats.heifers,
      percentage: stats.total > 0 ? Math.round((stats.heifers / stats.total) * 100) : 0,
      color: '#f59e0b',
    },
  ]

  return {
    totalHerd: stats.total,
    milking: stats.milking,
    dry: stats.dry,
    heifers: stats.heifers,
    distribution,
  }
}

export async function getDashboardTasks(): Promise<DashboardTask[]> {
  const supabase = await createClient()
  const today = new Date()

  // Calving due within 7 days
  const calvingDueDate = new Date(today)
  calvingDueDate.setDate(calvingDueDate.getDate() + 7)

  const { data: calvingDue } = await supabase
    .from('animals')
    .select('id', { count: 'exact', head: true })
    .not('expected_calving_date', 'is', null)
    .lte('expected_calving_date', calvingDueDate.toISOString().split('T')[0])
    .is('deleted_at', null)

  // To breed: Open cows past 60 DIM
  const sixtyDaysAgo = new Date(today)
  sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60)

  const { data: toBreed } = await supabase
    .from('animals')
    .select('id', { count: 'exact', head: true })
    .in('current_status', ['lactating', 'fresh'])
    .is('last_breeding_date', null)
    .lte('last_calving_date', sixtyDaysAgo.toISOString().split('T')[0])
    .is('deleted_at', null)

  // Pregnancy check due: Bred 35-45 days ago
  const thirtyFiveDaysAgo = new Date(today)
  thirtyFiveDaysAgo.setDate(thirtyFiveDaysAgo.getDate() - 45)
  const fortyFiveDaysAgo = new Date(today)
  fortyFiveDaysAgo.setDate(fortyFiveDaysAgo.getDate() - 35)

  const { data: pregCheck } = await supabase
    .from('animals')
    .select('id', { count: 'exact', head: true })
    .not('last_breeding_date', 'is', null)
    .is('pregnancy_confirmed_date', null)
    .lte('last_breeding_date', fortyFiveDaysAgo.toISOString().split('T')[0])
    .gte('last_breeding_date', thirtyFiveDaysAgo.toISOString().split('T')[0])
    .is('deleted_at', null)

  // Dry off due: Expected calving within 60 days, not yet dry
  const sixtyDaysFromNow = new Date(today)
  sixtyDaysFromNow.setDate(sixtyDaysFromNow.getDate() + 60)

  const { data: dryOff } = await supabase
    .from('animals')
    .select('id', { count: 'exact', head: true })
    .not('expected_calving_date', 'is', null)
    .lte('expected_calving_date', sixtyDaysFromNow.toISOString().split('T')[0])
    .in('current_status', ['lactating'])
    .is('deleted_at', null)

  return [
    { label: 'Calving Due', count: calvingDue?.length || 0, color: 'red', href: '/tasks?type=calving' },
    { label: 'To Breed', count: toBreed?.length || 0, color: 'yellow', href: '/tasks?type=breeding' },
    { label: 'Preg Check', count: pregCheck?.length || 0, color: 'green', href: '/tasks?type=preg_check' },
    { label: 'Dry Off', count: dryOff?.length || 0, color: 'blue', href: '/tasks?type=dry_off' },
  ]
}

export async function getDashboardAlerts(): Promise<DashboardAlert[]> {
  const supabase = await createClient()
  const alerts: DashboardAlert[] = []

  // High SCC alerts (> 400K)
  const { data: highSCCData } = await supabase
    .from('animals')
    .select('id, ear_tag, last_scc')
    .gt('last_scc', 400000)
    .is('deleted_at', null)
    .limit(3)

  const highSCC = (highSCCData || []) as Array<{ id: string; ear_tag: string; last_scc: number | null }>
  highSCC.forEach((animal) => {
    alerts.push({
      id: `scc-${animal.id}`,
      type: 'health',
      message: `Cow ${animal.ear_tag} — high SCC (${Math.round((animal.last_scc || 0) / 1000)}K)`,
      severity: 'high',
      animalId: animal.id,
    })
  })

  // Overdue pregnancy checks
  const today = new Date()
  const fortyFiveDaysAgo = new Date(today)
  fortyFiveDaysAgo.setDate(fortyFiveDaysAgo.getDate() - 45)

  const { data: overduePreg, count } = await supabase
    .from('animals')
    .select('id', { count: 'exact', head: true })
    .not('last_breeding_date', 'is', null)
    .is('pregnancy_confirmed_date', null)
    .lte('last_breeding_date', fortyFiveDaysAgo.toISOString().split('T')[0])
    .is('deleted_at', null)

  if (count && count > 0) {
    alerts.push({
      id: 'overdue-preg',
      type: 'overdue',
      message: `${count} cows with overdue pregnancy check`,
      severity: 'medium',
    })
  }

  return alerts.slice(0, 5)
}
