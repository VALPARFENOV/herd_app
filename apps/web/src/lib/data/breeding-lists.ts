import { createClient } from '@/lib/supabase/server'
import type { AnimalWithComputed } from './animals'
import { enrichAnimal } from './animals'
import type { Animal, Pen } from '@/types/database'

/**
 * Animal in breeding list with additional breeding-specific fields
 */
export interface BreedingListAnimal extends AnimalWithComputed {
  times_bred: number
  days_since_last_breeding: number | null
  days_since_last_heat: number | null
  days_to_calving: number | null
  days_carried: number | null
}

/**
 * Get animals ready to breed (OPEN, DIM > 60)
 */
export async function getToBreedList(): Promise<BreedingListAnimal[]> {
  const supabase = await createClient()
  const today = new Date()
  const sixtyDaysAgo = new Date(today)
  sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60)

  const { data, error } = await supabase
    .from('animals')
    .select('*, pens(name)')
    .in('current_status', ['lactating', 'fresh'])
    .is('last_breeding_date', null)
    .lte('last_calving_date', sixtyDaysAgo.toISOString().split('T')[0])
    .is('deleted_at', null)
    .order('last_calving_date', { ascending: true })

  if (error) {
    console.error('Error fetching to breed list:', error)
    return []
  }

  return (data || []).map((animal: Animal & { pens: { name: string } | null }) => {
    const { pens, ...animalData } = animal
    const enriched = enrichAnimal(animalData, pens ? { name: pens.name } as Pen : null)

    // Calculate breeding-specific fields
    const timesBred = 0 // No breeding yet
    const daysSinceLastBreeding = null
    const daysSinceLastHeat = animal.last_heat_date
      ? Math.floor((today.getTime() - new Date(animal.last_heat_date).getTime()) / (1000 * 60 * 60 * 24))
      : null

    return {
      ...enriched,
      times_bred: timesBred,
      days_since_last_breeding: daysSinceLastBreeding,
      days_since_last_heat: daysSinceLastHeat,
      days_to_calving: null,
      days_carried: null,
    }
  })
}

/**
 * Get animals due for pregnancy check (BRED, 35-45 days since breeding)
 */
export async function getPregCheckList(): Promise<BreedingListAnimal[]> {
  const supabase = await createClient()
  const today = new Date()

  const thirtyFiveDaysAgo = new Date(today)
  thirtyFiveDaysAgo.setDate(thirtyFiveDaysAgo.getDate() - 45)
  const fortyFiveDaysAgo = new Date(today)
  fortyFiveDaysAgo.setDate(fortyFiveDaysAgo.getDate() - 35)

  const { data, error } = await supabase
    .from('animals')
    .select('*, pens(name)')
    .not('last_breeding_date', 'is', null)
    .is('pregnancy_confirmed_date', null)
    .lte('last_breeding_date', fortyFiveDaysAgo.toISOString().split('T')[0])
    .gte('last_breeding_date', thirtyFiveDaysAgo.toISOString().split('T')[0])
    .is('deleted_at', null)
    .order('last_breeding_date', { ascending: true })

  if (error) {
    console.error('Error fetching preg check list:', error)
    return []
  }

  // Get breeding counts for each animal
  const animalIds = (data || []).map((a) => a.id)
  const { data: breedingEvents } = await supabase
    .from('events')
    .select('animal_id')
    .eq('event_type', 'breeding')
    .in('animal_id', animalIds)
    .is('deleted_at', null)

  const breedingCounts = new Map<string, number>()
  ;(breedingEvents || []).forEach((event) => {
    breedingCounts.set(event.animal_id, (breedingCounts.get(event.animal_id) || 0) + 1)
  })

  return (data || []).map((animal: Animal & { pens: { name: string } | null }) => {
    const { pens, ...animalData } = animal
    const enriched = enrichAnimal(animalData, pens ? { name: pens.name } as Pen : null)

    const timesBred = breedingCounts.get(animal.id) || 0
    const daysSinceLastBreeding = animal.last_breeding_date
      ? Math.floor((today.getTime() - new Date(animal.last_breeding_date).getTime()) / (1000 * 60 * 60 * 24))
      : null

    return {
      ...enriched,
      times_bred: timesBred,
      days_since_last_breeding: daysSinceLastBreeding,
      days_since_last_heat: null,
      days_to_calving: null,
      days_carried: null,
    }
  })
}

/**
 * Get animals ready to dry off (PREG, calving within 60 days)
 */
export async function getDryOffList(): Promise<BreedingListAnimal[]> {
  const supabase = await createClient()
  const today = new Date()
  const sixtyDaysFromNow = new Date(today)
  sixtyDaysFromNow.setDate(sixtyDaysFromNow.getDate() + 60)

  const { data, error } = await supabase
    .from('animals')
    .select('*, pens(name)')
    .not('expected_calving_date', 'is', null)
    .lte('expected_calving_date', sixtyDaysFromNow.toISOString().split('T')[0])
    .in('current_status', ['lactating'])
    .is('deleted_at', null)
    .order('expected_calving_date', { ascending: true })

  if (error) {
    console.error('Error fetching dry off list:', error)
    return []
  }

  return (data || []).map((animal: Animal & { pens: { name: string } | null }) => {
    const { pens, ...animalData } = animal
    const enriched = enrichAnimal(animalData, pens ? { name: pens.name } as Pen : null)

    const daysToCalving = animal.expected_calving_date
      ? Math.floor((new Date(animal.expected_calving_date).getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
      : null

    const daysCarried = animal.last_breeding_date && animal.expected_calving_date
      ? Math.floor(
          (new Date(animal.expected_calving_date).getTime() - new Date(animal.last_breeding_date).getTime()) /
            (1000 * 60 * 60 * 24)
        )
      : null

    return {
      ...enriched,
      times_bred: 0,
      days_since_last_breeding: null,
      days_since_last_heat: null,
      days_to_calving: daysToCalving,
      days_carried: daysCarried,
    }
  })
}

/**
 * Get fresh cows (DIM < 21)
 */
export async function getFreshCowsList(): Promise<BreedingListAnimal[]> {
  const supabase = await createClient()
  const today = new Date()
  const twentyOneDaysAgo = new Date(today)
  twentyOneDaysAgo.setDate(twentyOneDaysAgo.getDate() - 21)

  const { data, error } = await supabase
    .from('animals')
    .select('*, pens(name)')
    .in('current_status', ['lactating', 'fresh'])
    .gte('last_calving_date', twentyOneDaysAgo.toISOString().split('T')[0])
    .is('deleted_at', null)
    .order('last_calving_date', { ascending: false })

  if (error) {
    console.error('Error fetching fresh cows list:', error)
    return []
  }

  return (data || []).map((animal: Animal & { pens: { name: string } | null }) => {
    const { pens, ...animalData } = animal
    const enriched = enrichAnimal(animalData, pens ? { name: pens.name } as Pen : null)

    return {
      ...enriched,
      times_bred: 0,
      days_since_last_breeding: null,
      days_since_last_heat: null,
      days_to_calving: null,
      days_carried: null,
    }
  })
}

/**
 * Get summary counts for all breeding lists
 */
export async function getBreedingListCounts(): Promise<{
  toBreed: number
  pregCheck: number
  dryOff: number
  fresh: number
}> {
  const supabase = await createClient()
  const today = new Date()

  // To Breed count
  const sixtyDaysAgo = new Date(today)
  sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60)

  const { count: toBreedCount } = await supabase
    .from('animals')
    .select('id', { count: 'exact', head: true })
    .in('current_status', ['lactating', 'fresh'])
    .is('last_breeding_date', null)
    .lte('last_calving_date', sixtyDaysAgo.toISOString().split('T')[0])
    .is('deleted_at', null)

  // Preg Check count
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

  // Dry Off count
  const sixtyDaysFromNow = new Date(today)
  sixtyDaysFromNow.setDate(sixtyDaysFromNow.getDate() + 60)

  const { count: dryOffCount } = await supabase
    .from('animals')
    .select('id', { count: 'exact', head: true })
    .not('expected_calving_date', 'is', null)
    .lte('expected_calving_date', sixtyDaysFromNow.toISOString().split('T')[0])
    .in('current_status', ['lactating'])
    .is('deleted_at', null)

  // Fresh cows count
  const twentyOneDaysAgo = new Date(today)
  twentyOneDaysAgo.setDate(twentyOneDaysAgo.getDate() - 21)

  const { count: freshCount } = await supabase
    .from('animals')
    .select('id', { count: 'exact', head: true })
    .in('current_status', ['lactating', 'fresh'])
    .gte('last_calving_date', twentyOneDaysAgo.toISOString().split('T')[0])
    .is('deleted_at', null)

  return {
    toBreed: toBreedCount || 0,
    pregCheck: pregCheckCount || 0,
    dryOff: dryOffCount || 0,
    fresh: freshCount || 0,
  }
}
