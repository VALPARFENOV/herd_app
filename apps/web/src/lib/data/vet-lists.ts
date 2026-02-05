import { createClient } from '@/lib/supabase/server'

export interface VetListAnimal {
  id: string
  ear_tag: string
  name: string | null
  current_status: string
  current_lactation: number
  dim: number | null
  pen_name: string | null
  last_calving_date: string | null
  withdrawal_end_date: string | null
  withdrawal_days_remaining: number | null
  diagnosis: string | null
  treatment_date: string | null
}

export interface VetListCounts {
  fresh_check: number
  sick_pen: number
  scheduled_exams: number
  active_treatments: number
}

/**
 * Get fresh cows requiring veterinary check (DIM 7-14)
 */
export async function getFreshCheckList(): Promise<VetListAnimal[]> {
  const supabase = await createClient()
  const today = new Date()

  // Calculate date ranges for DIM 7-14
  const fourteenDaysAgo = new Date(today)
  fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14)

  const sevenDaysAgo = new Date(today)
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

  const { data, error } = await supabase
    .from('animals')
    .select('*, pens(name)')
    .eq('current_status', 'fresh')
    .gte('last_calving_date', fourteenDaysAgo.toISOString().split('T')[0])
    .lte('last_calving_date', sevenDaysAgo.toISOString().split('T')[0])
    .is('deleted_at', null)
    .order('last_calving_date', { ascending: true })

  if (error) {
    console.error('Error fetching fresh check list:', error)
    return []
  }

  return (data || []).map((animal) => ({
    id: animal.id,
    ear_tag: animal.ear_tag,
    name: animal.name,
    current_status: animal.current_status,
    current_lactation: animal.lactation_number,
    dim: calculateDIM(animal.last_calving_date),
    pen_name: (animal.pens as any)?.name || null,
    last_calving_date: animal.last_calving_date,
    withdrawal_end_date: null,
    withdrawal_days_remaining: null,
    diagnosis: null,
    treatment_date: null,
  }))
}

/**
 * Get animals with active treatments (withdrawal period active)
 */
export async function getActiveTreatmentsList(): Promise<VetListAnimal[]> {
  const supabase = await createClient()

  // Get animals with active withdrawal using the helper function
  const { data: withdrawalData, error: withdrawalError } = await supabase.rpc(
    'get_animals_with_active_withdrawal' as any,
    { p_tenant_id: '11111111-1111-1111-1111-111111111111' }
  )

  if (withdrawalError) {
    console.error('Error fetching animals with active withdrawal:', withdrawalError)
    return []
  }

  if (!withdrawalData || withdrawalData.length === 0) {
    return []
  }

  const animalIds = withdrawalData.map((w: any) => w.animal_id)

  // Get animal details
  const { data: animals, error: animalsError } = await supabase
    .from('animals')
    .select('*, pens(name)')
    .in('id', animalIds)
    .is('deleted_at', null)

  if (animalsError) {
    console.error('Error fetching animals:', animalsError)
    return []
  }

  // Get latest treatment events for these animals
  const { data: treatments, error: treatmentsError } = await supabase
    .from('events')
    .select('*')
    .in('animal_id', animalIds)
    .eq('event_type', 'treatment')
    .order('event_date', { ascending: false })

  if (treatmentsError) {
    console.error('Error fetching treatments:', treatmentsError)
  }

  // Map animals with withdrawal and treatment data
  return (animals || []).map((animal) => {
    const withdrawalInfo = withdrawalData.find((w: any) => w.animal_id === animal.id)
    const latestTreatment = (treatments || []).find((t) => t.animal_id === animal.id)

    return {
      id: animal.id,
      ear_tag: animal.ear_tag,
      name: animal.name,
      current_status: animal.current_status,
      current_lactation: animal.lactation_number,
      dim: calculateDIM(animal.last_calving_date),
      pen_name: (animal.pens as any)?.name || null,
      last_calving_date: animal.last_calving_date,
      withdrawal_end_date: withdrawalInfo?.withdrawal_end_date || null,
      withdrawal_days_remaining: withdrawalInfo?.days_remaining || null,
      diagnosis: (latestTreatment?.details as any)?.diagnosis || null,
      treatment_date: latestTreatment?.event_date || null,
    }
  })
}

/**
 * Get animals in sick pen (manual tagging required - placeholder)
 */
export async function getSickPenList(): Promise<VetListAnimal[]> {
  const supabase = await createClient()

  // For now, get animals with recent treatments (last 7 days)
  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

  const { data: recentTreatments, error } = await supabase
    .from('events')
    .select('animal_id, event_date, details')
    .eq('event_type', 'treatment')
    .gte('event_date', sevenDaysAgo.toISOString().split('T')[0])
    .order('event_date', { ascending: false })

  if (error) {
    console.error('Error fetching sick pen list:', error)
    return []
  }

  if (!recentTreatments || recentTreatments.length === 0) {
    return []
  }

  const animalIds = [...new Set(recentTreatments.map((t) => t.animal_id))]

  const { data: animals } = await supabase
    .from('animals')
    .select('*, pens(name)')
    .in('id', animalIds)
    .is('deleted_at', null)

  return (animals || []).map((animal) => {
    const latestTreatment = recentTreatments.find((t) => t.animal_id === animal.id)

    return {
      id: animal.id,
      ear_tag: animal.ear_tag,
      name: animal.name,
      current_status: animal.current_status,
      current_lactation: animal.lactation_number,
      dim: calculateDIM(animal.last_calving_date),
      pen_name: (animal.pens as any)?.name || null,
      last_calving_date: animal.last_calving_date,
      withdrawal_end_date: null,
      withdrawal_days_remaining: null,
      diagnosis: (latestTreatment?.details as any)?.diagnosis || null,
      treatment_date: latestTreatment?.event_date || null,
    }
  })
}

/**
 * Get animals with scheduled veterinary exams (placeholder - needs scheduling table)
 */
export async function getScheduledExamsList(): Promise<VetListAnimal[]> {
  // Placeholder - would require a vet_schedules table
  // For now return empty array
  return []
}

/**
 * Get counts for all vet lists
 */
export async function getVetListCounts(): Promise<VetListCounts> {
  const [freshCheck, sickPen, scheduledExams, activeTreatments] = await Promise.all([
    getFreshCheckList(),
    getSickPenList(),
    getScheduledExamsList(),
    getActiveTreatmentsList(),
  ])

  return {
    fresh_check: freshCheck.length,
    sick_pen: sickPen.length,
    scheduled_exams: scheduledExams.length,
    active_treatments: activeTreatments.length,
  }
}

/**
 * Helper function to calculate DIM (Days in Milk)
 */
function calculateDIM(lastCalvingDate: string | null): number | null {
  if (!lastCalvingDate) return null

  const calving = new Date(lastCalvingDate)
  const today = new Date()
  const diffTime = today.getTime() - calving.getTime()
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))

  return diffDays >= 0 ? diffDays : null
}
