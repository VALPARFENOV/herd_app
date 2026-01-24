import { createClient } from '@/lib/supabase/server'
import type { Animal, Pen } from '@/types/database'

// Computed/derived type for display
export interface AnimalWithComputed extends Animal {
  dim: number | null // Days in milk
  rc: string // Reproductive code
  displayStatus: 'active' | 'attention' | 'alert'
  pen_name: string | null
}

function computeDIM(animal: Animal): number | null {
  if (!animal.last_calving_date) return null
  const calvingDate = new Date(animal.last_calving_date)
  const today = new Date()
  const diffTime = today.getTime() - calvingDate.getTime()
  return Math.floor(diffTime / (1000 * 60 * 60 * 24))
}

function computeRC(animal: Animal): string {
  // Reproductive Code logic based on animal state
  if (animal.current_status === 'dry') return 'DRY'
  if (animal.current_status === 'heifer') return 'HEIFER'

  const dim = computeDIM(animal)
  if (dim !== null && dim <= 21) return 'FRESH'

  if (animal.pregnancy_confirmed_date) return 'PREG'
  if (animal.last_breeding_date && !animal.pregnancy_confirmed_date) return 'BRED'

  return 'OPEN'
}

function computeDisplayStatus(animal: Animal): 'active' | 'attention' | 'alert' {
  // Check for alert conditions
  if (animal.last_scc && animal.last_scc > 400000) return 'alert'
  if (animal.bcs_score && (animal.bcs_score < 2 || animal.bcs_score > 4.5)) return 'alert'

  // Check for attention conditions
  const dim = computeDIM(animal)
  if (dim && dim > 60 && !animal.last_breeding_date && animal.current_status === 'lactating') {
    return 'attention' // Open cow past 60 DIM
  }
  if (animal.last_scc && animal.last_scc > 200000) return 'attention'

  return 'active'
}

export function enrichAnimal(animal: Animal, pen?: Pen | null): AnimalWithComputed {
  return {
    ...animal,
    dim: computeDIM(animal),
    rc: computeRC(animal),
    displayStatus: computeDisplayStatus(animal),
    pen_name: pen?.name || null,
  }
}

export async function getAnimals(options?: {
  status?: Animal['current_status']
  filter?: 'fresh' | 'to_breed' | 'preg_check' | 'dry_off' | 'vet'
  limit?: number
  offset?: number
  search?: string
}): Promise<{ data: AnimalWithComputed[]; count: number }> {
  const supabase = await createClient()
  const today = new Date()

  let query = supabase
    .from('animals')
    .select('*, pens(name)', { count: 'exact' })
    .is('deleted_at', null)
    .order('ear_tag')

  if (options?.status) {
    query = query.eq('current_status', options.status)
  }

  // Apply quick access filters
  if (options?.filter) {
    switch (options.filter) {
      case 'fresh': {
        // Fresh cows: DIM < 21
        const twentyOneDaysAgo = new Date(today)
        twentyOneDaysAgo.setDate(twentyOneDaysAgo.getDate() - 21)
        query = query
          .in('current_status', ['lactating', 'fresh'])
          .gte('last_calving_date', twentyOneDaysAgo.toISOString().split('T')[0])
        break
      }
      case 'to_breed': {
        // Open cows past 60 DIM
        const sixtyDaysAgo = new Date(today)
        sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60)
        query = query
          .in('current_status', ['lactating', 'fresh'])
          .is('last_breeding_date', null)
          .lte('last_calving_date', sixtyDaysAgo.toISOString().split('T')[0])
        break
      }
      case 'preg_check': {
        // Bred cows 35-45 days after breeding
        const thirtyFiveDaysAgo = new Date(today)
        thirtyFiveDaysAgo.setDate(thirtyFiveDaysAgo.getDate() - 45)
        const fortyFiveDaysAgo = new Date(today)
        fortyFiveDaysAgo.setDate(fortyFiveDaysAgo.getDate() - 35)
        query = query
          .not('last_breeding_date', 'is', null)
          .is('pregnancy_confirmed_date', null)
          .lte('last_breeding_date', fortyFiveDaysAgo.toISOString().split('T')[0])
          .gte('last_breeding_date', thirtyFiveDaysAgo.toISOString().split('T')[0])
        break
      }
      case 'dry_off': {
        // Pregnant cows due to calve within 60 days
        const sixtyDaysFromNow = new Date(today)
        sixtyDaysFromNow.setDate(sixtyDaysFromNow.getDate() + 60)
        query = query
          .not('expected_calving_date', 'is', null)
          .lte('expected_calving_date', sixtyDaysFromNow.toISOString().split('T')[0])
          .in('current_status', ['lactating'])
        break
      }
      // Note: 'vet' filter is handled separately as it requires joining with events table
    }
  }

  if (options?.search) {
    query = query.or(`ear_tag.ilike.%${options.search}%,name.ilike.%${options.search}%`)
  }

  if (options?.limit) {
    query = query.limit(options.limit)
  }

  if (options?.offset) {
    query = query.range(options.offset, options.offset + (options.limit || 10) - 1)
  }

  const { data, error, count } = await query

  if (error) {
    console.error('Error fetching animals:', error)
    return { data: [], count: 0 }
  }

  const enrichedData = (data || []).map((animal: Animal & { pens: { name: string } | null }) => {
    const { pens, ...animalData } = animal
    return enrichAnimal(animalData, pens ? { name: pens.name } as Pen : null)
  })

  return { data: enrichedData, count: count || 0 }
}

export async function getAnimalById(id: string): Promise<AnimalWithComputed | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('animals')
    .select('*, pens(name)')
    .eq('id', id)
    .is('deleted_at', null)
    .single()

  if (error || !data) {
    console.error('Error fetching animal:', error)
    return null
  }

  const { pens, ...animalData } = data as Animal & { pens: { name: string } | null }
  return enrichAnimal(animalData, pens ? { name: pens.name } as Pen : null)
}

export async function getAnimalStats(): Promise<{
  total: number
  milking: number
  dry: number
  fresh: number
  heifers: number
  attention: number
}> {
  const supabase = await createClient()

  const { data: animalsData, error } = await supabase
    .from('animals')
    .select('current_status, last_calving_date, last_breeding_date, last_scc, bcs_score, pregnancy_confirmed_date')
    .is('deleted_at', null)

  const animals = animalsData as Animal[] | null
  if (error || !animals) {
    console.error('Error fetching animal stats:', error)
    return { total: 0, milking: 0, dry: 0, fresh: 0, heifers: 0, attention: 0 }
  }

  let milking = 0
  let dry = 0
  let fresh = 0
  let heifers = 0
  let attention = 0

  animals.forEach((animal) => {
    const enriched = enrichAnimal(animal, null)

    if (animal.current_status === 'heifer') {
      heifers++
    } else if (animal.current_status === 'dry') {
      dry++
    } else if (enriched.rc === 'FRESH') {
      fresh++
      milking++
    } else if (animal.current_status === 'lactating' || animal.current_status === 'fresh') {
      milking++
    }

    if (enriched.displayStatus !== 'active') {
      attention++
    }
  })

  return {
    total: animals.length,
    milking,
    dry,
    fresh,
    heifers,
    attention,
  }
}
