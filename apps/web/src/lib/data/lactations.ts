import { createClient } from '@/lib/supabase/server'
import type { Lactation } from '@/types/database'

export async function getLactationsByAnimalId(animalId: string): Promise<Lactation[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('lactations')
    .select('*')
    .eq('animal_id', animalId)
    .order('lactation_number', { ascending: false })

  if (error) {
    console.error('Error fetching lactations:', error)
    return []
  }

  return data || []
}

export async function getCurrentLactation(animalId: string): Promise<Lactation | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('lactations')
    .select('*')
    .eq('animal_id', animalId)
    .is('dry_date', null)
    .order('lactation_number', { ascending: false })
    .limit(1)
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      // No rows returned
      return null
    }
    console.error('Error fetching current lactation:', error)
    return null
  }

  return data
}

export async function getLactationStats(animalId: string): Promise<{
  totalLactations: number
  averageMilk305: number | null
  bestLactation: Lactation | null
}> {
  const lactations = await getLactationsByAnimalId(animalId)

  if (lactations.length === 0) {
    return { totalLactations: 0, averageMilk305: null, bestLactation: null }
  }

  const completedLactations = lactations.filter((l) => l.me_305_milk !== null)
  const avgMilk =
    completedLactations.length > 0
      ? completedLactations.reduce((sum, l) => sum + (l.me_305_milk || 0), 0) /
        completedLactations.length
      : null

  const bestLactation = completedLactations.length > 0
    ? completedLactations.reduce((best, l) =>
        (l.me_305_milk || 0) > (best.me_305_milk || 0) ? l : best
      )
    : null

  return {
    totalLactations: lactations.length,
    averageMilk305: avgMilk,
    bestLactation,
  }
}
