import { createClient } from '@/lib/supabase/server'
import { getAnimalStats } from './animals'
import { getDashboardAlerts } from './dashboard'

/**
 * Quick access item for sidebar
 */
export interface QuickAccessItem {
  name: string
  href: string
  count: number
}

/**
 * Herd overview stats for sidebar
 */
export interface HerdOverview {
  total: number
  milking: number
  dry: number
  heifers: number
}

/**
 * Complete sidebar data
 */
export interface SidebarData {
  quickAccess: QuickAccessItem[]
  herdOverview: HerdOverview
}

/**
 * Get all sidebar counters from database
 */
export async function getSidebarCounters(): Promise<SidebarData> {
  const supabase = await createClient()
  const today = new Date()

  // Get herd overview stats
  const stats = await getAnimalStats()

  // Fresh cows (DIM < 21)
  const twentyOneDaysAgo = new Date(today)
  twentyOneDaysAgo.setDate(twentyOneDaysAgo.getDate() - 21)

  const { count: freshCount } = await supabase
    .from('animals')
    .select('id', { count: 'exact', head: true })
    .in('current_status', ['lactating', 'fresh'])
    .gte('last_calving_date', twentyOneDaysAgo.toISOString().split('T')[0])
    .is('deleted_at', null)

  // To breed: Open cows past 60 DIM
  const sixtyDaysAgo = new Date(today)
  sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60)

  const { count: toBreedCount } = await supabase
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

  const { count: pregCheckCount } = await supabase
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

  const { count: dryOffCount } = await supabase
    .from('animals')
    .select('id', { count: 'exact', head: true })
    .not('expected_calving_date', 'is', null)
    .lte('expected_calving_date', sixtyDaysFromNow.toISOString().split('T')[0])
    .in('current_status', ['lactating'])
    .is('deleted_at', null)

  // Vet list: Animals with upcoming vet checks or active treatments
  // For MVP, count animals with recent vet events (last 7 days) or scheduled checks
  const sevenDaysAgo = new Date(today)
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

  const { count: vetListCount } = await supabase
    .from('events')
    .select('animal_id', { count: 'exact', head: true })
    .in('event_type', ['treatment', 'vaccination', 'vet_exam'])
    .gte('event_date', sevenDaysAgo.toISOString().split('T')[0])
    .is('deleted_at', null)

  // Alerts: Get count from dashboard alerts
  const alerts = await getDashboardAlerts()

  return {
    quickAccess: [
      {
        name: 'Fresh Cows',
        href: '/animals?filter=fresh',
        count: freshCount || 0,
      },
      {
        name: 'To Breed',
        href: '/animals?filter=to_breed',
        count: toBreedCount || 0,
      },
      {
        name: 'Pregnancy Check',
        href: '/animals?filter=preg_check',
        count: pregCheckCount || 0,
      },
      {
        name: 'Dry Off',
        href: '/animals?filter=dry_off',
        count: dryOffCount || 0,
      },
      {
        name: 'Vet List',
        href: '/animals?filter=vet',
        count: vetListCount || 0,
      },
      {
        name: 'Alerts',
        href: '/alerts',
        count: alerts.length,
      },
    ],
    herdOverview: {
      total: stats.total,
      milking: stats.milking,
      dry: stats.dry,
      heifers: stats.heifers,
    },
  }
}
