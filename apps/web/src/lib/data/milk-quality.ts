import { createClient } from '@/lib/supabase/server'

export interface MilkTest {
  id: string
  animal_id: string
  test_date: string
  test_number: number
  dim: number | null
  lactation_number: number
  milk_kg: number
  fat_percent: number
  protein_percent: number
  scc: number
  mun: number | null
  bhn: number | null
  fat_protein_ratio: number
  energy_corrected_milk: number
  lab_name: string | null
  sample_id: string | null
}

export interface MilkTestWithAnimal extends MilkTest {
  animal_ear_tag: string
  animal_name: string | null
}

export interface BulkTankReading {
  time: string
  volume_liters: number
  temperature: number | null
  fat_percent: number
  protein_percent: number
  scc_avg: number
  bacteria_count: number | null
  price_per_liter: number
  total_value: number
  truck_number: string | null
  driver_name: string | null
}

export interface HerdQualityMetrics {
  avg_milk: number
  avg_fat_percent: number
  avg_protein_percent: number
  avg_scc: number
  pct_high_scc: number
  test_count: number
  cow_count: number
}

export interface BulkTankStats {
  total_volume: number
  avg_fat_percent: number
  avg_protein_percent: number
  avg_scc: number
  avg_price: number
  total_revenue: number
  pickup_count: number
}

export interface HighSCCAnimal {
  animal_id: string
  ear_tag: string
  latest_scc: number
  test_date: string
  consecutive_high_tests: number
}

export interface QualityDashboardData {
  herd_metrics: HerdQualityMetrics | null
  bulk_tank_stats: BulkTankStats | null
  high_scc_animals: HighSCCAnimal[]
  recent_tank_readings: BulkTankReading[]
}

/**
 * Get herd quality metrics for the last 30 days
 */
export async function getHerdQualityMetrics(days: number = 30): Promise<HerdQualityMetrics | null> {
  const supabase = await createClient()
  const endDate = new Date()
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - days)

  const { data, error } = await supabase.rpc('get_herd_quality_metrics', {
    p_tenant_id: '11111111-1111-1111-1111-111111111111',
    p_start_date: startDate.toISOString().split('T')[0],
    p_end_date: endDate.toISOString().split('T')[0],
  })

  if (error) {
    console.error('Error fetching herd quality metrics:', error)
    return null
  }

  return data?.[0] || null
}

/**
 * Get bulk tank statistics for the last 30 days
 */
export async function getBulkTankStats(days: number = 30): Promise<BulkTankStats | null> {
  const supabase = await createClient()
  const endDate = new Date()
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - days)

  const { data, error } = await supabase.rpc('get_bulk_tank_stats', {
    p_tenant_id: '11111111-1111-1111-1111-111111111111',
    p_start_date: startDate.toISOString(),
    p_end_date: endDate.toISOString(),
  })

  if (error) {
    console.error('Error fetching bulk tank stats:', error)
    return null
  }

  return data?.[0] || null
}

/**
 * Get animals with high SCC (>200k)
 */
export async function getAnimalsWithHighSCC(
  threshold: number = 200000
): Promise<HighSCCAnimal[]> {
  const supabase = await createClient()

  const { data, error } = await supabase.rpc('get_animals_with_high_scc', {
    p_tenant_id: '11111111-1111-1111-1111-111111111111',
    p_threshold: threshold,
  })

  if (error) {
    console.error('Error fetching animals with high SCC:', error)
    return []
  }

  return data || []
}

/**
 * Get recent bulk tank readings
 */
export async function getRecentBulkTankReadings(limit: number = 7): Promise<BulkTankReading[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('bulk_tank_readings')
    .select('*')
    .eq('tenant_id', '11111111-1111-1111-1111-111111111111')
    .order('time', { ascending: false })
    .limit(limit)

  if (error) {
    console.error('Error fetching bulk tank readings:', error)
    return []
  }

  return data || []
}

/**
 * Get milk tests for a specific animal
 */
export async function getAnimalMilkTests(animalId: string): Promise<MilkTest[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('milk_tests')
    .select('*')
    .eq('animal_id', animalId)
    .is('deleted_at', null)
    .order('test_date', { ascending: false })

  if (error) {
    console.error('Error fetching animal milk tests:', error)
    return []
  }

  return data || []
}

/**
 * Get latest milk test for an animal
 */
export async function getLatestMilkTest(animalId: string): Promise<MilkTest | null> {
  const supabase = await createClient()

  const { data, error } = await supabase.rpc('get_latest_milk_test', {
    p_animal_id: animalId,
  })

  if (error) {
    console.error('Error fetching latest milk test:', error)
    return null
  }

  return data?.[0] || null
}

/**
 * Get recent milk tests with animal info (for tables/lists)
 */
export async function getRecentMilkTests(limit: number = 50): Promise<MilkTestWithAnimal[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('milk_tests')
    .select(
      `
      *,
      animals!inner(ear_tag, name)
    `
    )
    .eq('tenant_id', '11111111-1111-1111-1111-111111111111')
    .is('deleted_at', null)
    .order('test_date', { ascending: false })
    .limit(limit)

  if (error) {
    console.error('Error fetching recent milk tests:', error)
    return []
  }

  return (data || []).map((test: any) => ({
    ...test,
    animal_ear_tag: test.animals.ear_tag,
    animal_name: test.animals.name,
  }))
}

/**
 * Get quality dashboard data (combined query for dashboard)
 */
export async function getQualityDashboardData(): Promise<QualityDashboardData> {
  const [herdMetrics, bulkTankStats, highSCCAnimals, recentReadings] = await Promise.all([
    getHerdQualityMetrics(30),
    getBulkTankStats(30),
    getAnimalsWithHighSCC(200000),
    getRecentBulkTankReadings(7),
  ])

  return {
    herd_metrics: herdMetrics,
    bulk_tank_stats: bulkTankStats,
    high_scc_animals: highSCCAnimals,
    recent_tank_readings: recentReadings,
  }
}

/**
 * Get bulk tank readings for chart (time series)
 */
export async function getBulkTankChartData(days: number = 30): Promise<BulkTankReading[]> {
  const supabase = await createClient()
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - days)

  const { data, error } = await supabase
    .from('bulk_tank_readings')
    .select('*')
    .eq('tenant_id', '11111111-1111-1111-1111-111111111111')
    .gte('time', startDate.toISOString())
    .order('time', { ascending: true })

  if (error) {
    console.error('Error fetching bulk tank chart data:', error)
    return []
  }

  return data || []
}
