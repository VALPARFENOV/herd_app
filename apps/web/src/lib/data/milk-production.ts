import { createClient } from '@/lib/supabase/server'

/**
 * Daily milk production data for charts
 */
export interface DailyMilkProduction {
  date: string // ISO date string (YYYY-MM-DD)
  totalKg: number
  avgPerCow: number
  cowsMilked: number
}

/**
 * Get daily milk production for the herd
 * Uses TimescaleDB continuous aggregate for fast queries
 */
export async function getDailyMilkProduction(days: number = 30): Promise<DailyMilkProduction[]> {
  const supabase = await createClient()

  // Use the SQL function we created in the schema
  const { data, error } = await supabase.rpc('get_daily_milk_production', {
    p_tenant_id: (await supabase.auth.getUser()).data.user?.user_metadata?.tenant_id,
    p_days: days,
  })

  if (error) {
    console.error('Error fetching daily milk production:', error)
    return []
  }

  if (!data || (data as any).length === 0) {
    return []
  }

  // Map database response to our interface
  return (data as any[]).map((row: any) => ({
    date: row.date,
    totalKg: parseFloat(row.total_kg || 0),
    avgPerCow: parseFloat(row.avg_per_cow || 0),
    cowsMilked: parseInt(row.cows_milked || 0, 10),
  }))
}

/**
 * Get milk production for a specific animal
 * Used in animal card Production tab
 */
export async function getAnimalMilkProduction(
  animalId: string,
  days: number = 90
): Promise<
  {
    date: string
    totalKg: number
    milkingsCount: number
    avgKg: number
  }[]
> {
  const supabase = await createClient()

  const { data, error } = await supabase.rpc('get_animal_milk_production', {
    p_animal_id: animalId,
    p_days: days,
  })

  if (error) {
    console.error('Error fetching animal milk production:', error)
    return []
  }

  if (!data || (data as any).length === 0) {
    return []
  }

  return (data as any[]).map((row: any) => ({
    date: row.date,
    totalKg: parseFloat(row.total_kg || 0),
    milkingsCount: parseInt(row.milkings_count || 0, 10),
    avgKg: parseFloat(row.avg_kg || 0),
  }))
}

/**
 * Get latest milking session for an animal
 * Used for displaying most recent data in cards/alerts
 */
export async function getLatestMilking(animalId: string): Promise<{
  time: string
  sessionId: string
  milkKg: number
  durationSeconds: number
  avgFlowRate: number
} | null> {
  const supabase = await createClient()

  const { data, error } = await supabase.rpc('get_latest_milking', {
    p_animal_id: animalId,
  })

  if (error) {
    console.error('Error fetching latest milking:', error)
    return null
  }

  if (!data || (data as any).length === 0) {
    return null
  }

  const row = (data as any)[0]
  return {
    time: row.time,
    sessionId: row.session_id,
    milkKg: parseFloat(row.milk_kg || 0),
    durationSeconds: parseInt(row.duration_seconds || 0, 10),
    avgFlowRate: parseFloat(row.avg_flow_rate || 0),
  }
}

/**
 * Get milk production statistics for dashboard
 * Returns aggregated metrics for the current week
 */
export async function getMilkProductionStats(): Promise<{
  weeklyTotal: number
  dailyAvg: number
  avgPerCow: number
  trend: 'up' | 'down' | 'stable'
  changePercent: number
}> {
  const supabase = await createClient()

  // Get last 14 days to calculate trend
  const productionData = await getDailyMilkProduction(14)

  if (productionData.length === 0) {
    return {
      weeklyTotal: 0,
      dailyAvg: 0,
      avgPerCow: 0,
      trend: 'stable',
      changePercent: 0,
    }
  }

  // Split into current week (last 7 days) and previous week
  const currentWeek = productionData.slice(-7)
  const previousWeek = productionData.slice(-14, -7)

  const currentTotal = currentWeek.reduce((sum, day) => sum + day.totalKg, 0)
  const previousTotal = previousWeek.reduce((sum, day) => sum + day.totalKg, 0)

  const dailyAvg = currentTotal / currentWeek.length
  const avgPerCow = currentWeek.reduce((sum, day) => sum + day.avgPerCow, 0) / currentWeek.length

  // Calculate trend
  const changePercent = previousTotal > 0 ? ((currentTotal - previousTotal) / previousTotal) * 100 : 0

  let trend: 'up' | 'down' | 'stable' = 'stable'
  if (changePercent > 2) trend = 'up'
  else if (changePercent < -2) trend = 'down'

  return {
    weeklyTotal: currentTotal,
    dailyAvg,
    avgPerCow,
    trend,
    changePercent: Math.abs(changePercent),
  }
}

/**
 * Get milk quality alerts (based on abnormal readings)
 * Returns cows with blood detection or color abnormalities in recent milkings
 */
export async function getMilkQualityAlerts(): Promise<
  {
    animalId: string
    earTag: string
    lastIssue: string
    issueType: 'blood' | 'color'
    sessionId: string
  }[]
> {
  const supabase = await createClient()

  // Query for recent abnormal readings (last 7 days)
  const { data, error } = await supabase
    .from('milk_readings')
    .select(
      `
      animal_id,
      session_id,
      blood_detected,
      color_abnormal,
      time,
      animals!inner(ear_tag)
    `
    )
    .gte('time', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
    .or('blood_detected.eq.true,color_abnormal.eq.true')
    .order('time', { ascending: false })
    .limit(10)

  if (error) {
    console.error('Error fetching milk quality alerts:', error)
    return []
  }

  if (!data || data.length === 0) {
    return []
  }

  return data.map((row: any) => ({
    animalId: row.animal_id,
    earTag: row.animals?.ear_tag || 'Unknown',
    lastIssue: row.time,
    issueType: row.blood_detected ? 'blood' : 'color',
    sessionId: row.session_id,
  }))
}
