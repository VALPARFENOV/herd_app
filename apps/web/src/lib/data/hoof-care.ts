import { createClient } from '@/lib/supabase/server'

/**
 * Hoof inspection with lesion details
 */
export interface HoofInspection {
  id: string
  animalId: string
  inspectionDate: string
  locomotionScore: number | null
  hasLesions: boolean
  needsFollowup: boolean
  followupDate: string | null
  inspectorName: string | null
  overallNotes: string | null
  lesions: HoofLesion[]
}

/**
 * Individual hoof lesion finding
 */
export interface HoofLesion {
  id: string
  leg: 'LF' | 'LR' | 'RF' | 'RR' // Left/Right Front/Rear
  claw: 'inner' | 'outer'
  zone: number // 1-11 per ICAR standard
  lesionType: string | null // DD, SU, WLD, TU, IDD, HHE, etc.
  lesionCode: string | null
  severity: number // 0=none, 1=mild, 2=moderate, 3=severe
  treatmentType: string | null
  treatmentProduct: string | null
  isNew: boolean
  isHealed: boolean
  notes: string | null
}

/**
 * Get all hoof inspections for an animal
 */
export async function getHoofInspections(animalId: string): Promise<HoofInspection[]> {
  const supabase = await createClient()

  const { data: inspections, error } = await supabase
    .from('hoof_inspections')
    .select(
      `
      id,
      animal_id,
      inspection_date,
      locomotion_score,
      has_lesions,
      needs_followup,
      followup_date,
      inspector_name,
      overall_notes
    `
    )
    .eq('animal_id', animalId)
    .order('inspection_date', { ascending: false })

  if (error) {
    console.error('Error fetching hoof inspections:', error)
    return []
  }

  if (!inspections || inspections.length === 0) {
    return []
  }

  // Fetch lesions for all inspections
  const inspectionIds = inspections.map((i) => i.id)
  const { data: lesions } = await supabase
    .from('hoof_zone_findings')
    .select('*')
    .in('inspection_id', inspectionIds)

  // Group lesions by inspection
  const lesionsByInspection = new Map<string, any[]>()
  lesions?.forEach((lesion) => {
    const inspectionLesions = lesionsByInspection.get(lesion.inspection_id) || []
    inspectionLesions.push(lesion)
    lesionsByInspection.set(lesion.inspection_id, inspectionLesions)
  })

  // Map to our interface
  return inspections.map((inspection) => ({
    id: inspection.id,
    animalId: inspection.animal_id,
    inspectionDate: inspection.inspection_date,
    locomotionScore: inspection.locomotion_score,
    hasLesions: inspection.has_lesions,
    needsFollowup: inspection.needs_followup,
    followupDate: inspection.followup_date,
    inspectorName: inspection.inspector_name,
    overallNotes: inspection.overall_notes,
    lesions: (lesionsByInspection.get(inspection.id) || []).map((lesion) => ({
      id: lesion.id,
      leg: lesion.leg,
      claw: lesion.claw,
      zone: lesion.zone,
      lesionType: lesion.lesion_type,
      lesionCode: lesion.lesion_code,
      severity: lesion.severity,
      treatmentType: lesion.treatment_type,
      treatmentProduct: lesion.treatment_product,
      isNew: lesion.is_new,
      isHealed: lesion.is_healed,
      notes: lesion.notes,
    })),
  }))
}

/**
 * Get the latest hoof inspection for an animal
 */
export async function getLatestHoofInspection(animalId: string): Promise<HoofInspection | null> {
  const inspections = await getHoofInspections(animalId)
  return inspections.length > 0 ? inspections[0] : null
}

/**
 * Get hoof inspection statistics for the herd
 */
export async function getHoofHealthStats(tenantId?: string): Promise<{
  totalInspections: number
  cowsWithLesions: number
  avgLocomotionScore: number
  needingFollowup: number
}> {
  const supabase = await createClient()

  const query = supabase
    .from('hoof_inspections')
    .select('id, has_lesions, locomotion_score, needs_followup', { count: 'exact' })

  // Note: tenant filtering would happen through RLS in production

  const { data, count } = await query

  if (!data || data.length === 0) {
    return {
      totalInspections: 0,
      cowsWithLesions: 0,
      avgLocomotionScore: 0,
      needingFollowup: 0,
    }
  }

  const cowsWithLesions = data.filter((i) => i.has_lesions).length
  const needingFollowup = data.filter((i) => i.needs_followup).length
  const validScores = data.filter((i) => i.locomotion_score !== null)
  const avgLocomotionScore =
    validScores.length > 0
      ? validScores.reduce((sum, i) => sum + (i.locomotion_score || 0), 0) / validScores.length
      : 0

  return {
    totalInspections: count || 0,
    cowsWithLesions,
    avgLocomotionScore: Math.round(avgLocomotionScore * 10) / 10,
    needingFollowup,
  }
}

/**
 * Common lesion types for dropdowns
 */
export const LESION_TYPES = [
  { code: 'DD', name: 'Digital Dermatitis (strawberry)' },
  { code: 'SU', name: 'Sole Ulcer' },
  { code: 'WLD', name: 'White Line Disease' },
  { code: 'TU', name: 'Toe Ulcer' },
  { code: 'IDD', name: 'Interdigital Dermatitis' },
  { code: 'HHE', name: 'Heel Horn Erosion' },
  { code: 'TH', name: 'Thin Sole' },
  { code: 'OG', name: 'Overgrown Hoof' },
  { code: 'VER', name: 'Verrucose/Hairy Warts' },
  { code: 'COR', name: 'Corkscrew Claw' },
  { code: 'FT', name: 'Foreign Object' },
] as const

/**
 * Hoof zones per ICAR standard
 */
export const HOOF_ZONES = [
  { zone: 1, name: 'Heel/Bulb' },
  { zone: 2, name: 'Sole Junction' },
  { zone: 3, name: 'Apex of Sole' },
  { zone: 4, name: 'White Line (apex)' },
  { zone: 5, name: 'White Line (abaxial)' },
  { zone: 6, name: 'White Line (axial)' },
  { zone: 7, name: 'Wall (apex)' },
  { zone: 8, name: 'Wall (abaxial)' },
  { zone: 9, name: 'Wall (axial)' },
  { zone: 10, name: 'Interdigital Space' },
  { zone: 11, name: 'Coronary Band' },
] as const
