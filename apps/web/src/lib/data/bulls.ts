import { createClient } from '@/lib/supabase/server'

/**
 * Bull with genomic data
 */
export interface Bull {
  id: string
  tenant_id: string
  registration_number: string | null
  name: string
  short_name: string | null
  breed: string
  naab_code: string | null
  stud_code: string | null
  genomic_data: {
    milk?: number
    fat?: number
    protein?: number
    pl?: number // Productive Life
    scs?: number // Somatic Cell Score
    dpr?: number // Daughter Pregnancy Rate
    type?: number
  } | null
  net_merit_dollars: number | null
  sire_calving_ease: number | null
  daughter_calving_ease: number | null
  semen_cost_per_straw: number | null
  is_active: boolean
  is_sexed: boolean
  notes: string | null
  created_at: string
  updated_at: string
}

/**
 * Bull with inventory summary
 */
export interface BullWithInventory extends Bull {
  total_straws: number
  available_straws: number
  batches_count: number
}

/**
 * Semen inventory batch
 */
export interface SemenInventory {
  id: string
  tenant_id: string
  bull_id: string
  batch_number: string | null
  lot_number: string | null
  straws_received: number
  straws_used: number
  straws_available: number
  received_date: string
  expiry_date: string | null
  cost_per_straw: number | null
  total_cost: number | null
  tank_number: string | null
  canister_number: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

/**
 * Get all bulls with inventory summary
 */
export async function getBullsWithInventory(activeOnly: boolean = true): Promise<BullWithInventory[]> {
  const supabase = await createClient()

  let query = supabase
    .from('bulls')
    .select(`
      *,
      semen_inventory (
        straws_received,
        straws_used,
        straws_available,
        deleted_at
      )
    `)
    .is('deleted_at', null)
    .order('short_name')

  if (activeOnly) {
    query = query.eq('is_active', true)
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching bulls:', error)
    return []
  }

  return (data || []).map((bull: any) => {
    const inventory = (bull.semen_inventory || []).filter((inv: any) => !inv.deleted_at)
    const totalStraws = inventory.reduce((sum: number, inv: any) => sum + inv.straws_received, 0)
    const availableStraws = inventory.reduce((sum: number, inv: any) => sum + inv.straws_available, 0)

    return {
      id: bull.id,
      tenant_id: bull.tenant_id,
      registration_number: bull.registration_number,
      name: bull.name,
      short_name: bull.short_name,
      breed: bull.breed,
      naab_code: bull.naab_code,
      stud_code: bull.stud_code,
      genomic_data: bull.genomic_data,
      net_merit_dollars: bull.net_merit_dollars,
      sire_calving_ease: bull.sire_calving_ease,
      daughter_calving_ease: bull.daughter_calving_ease,
      semen_cost_per_straw: bull.semen_cost_per_straw,
      is_active: bull.is_active,
      is_sexed: bull.is_sexed,
      notes: bull.notes,
      created_at: bull.created_at,
      updated_at: bull.updated_at,
      total_straws: totalStraws,
      available_straws: availableStraws,
      batches_count: inventory.length,
    }
  })
}

/**
 * Get bull by ID
 */
export async function getBullById(id: string): Promise<Bull | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('bulls')
    .select('*')
    .eq('id', id)
    .is('deleted_at', null)
    .single()

  if (error || !data) {
    console.error('Error fetching bull:', error)
    return null
  }

  return data as unknown as Bull
}

/**
 * Get semen inventory for a bull
 */
export async function getSemenInventory(bullId: string): Promise<SemenInventory[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('semen_inventory')
    .select('*')
    .eq('bull_id', bullId)
    .is('deleted_at', null)
    .order('received_date', { ascending: false })

  if (error) {
    console.error('Error fetching semen inventory:', error)
    return []
  }

  return data as unknown as SemenInventory[]
}

/**
 * Get bulls with low inventory (< 10 straws)
 */
export async function getBullsWithLowInventory(): Promise<BullWithInventory[]> {
  const bulls = await getBullsWithInventory(true)
  return bulls.filter((bull) => bull.available_straws < 10 && bull.available_straws > 0)
}

/**
 * Get active bulls for dropdown selection
 */
export async function getActiveBullsForSelection(): Promise<
  Array<{ id: string; name: string; breed: string; available_straws: number; cost: number | null }>
> {
  const bulls = await getBullsWithInventory(true)

  return bulls
    .filter((bull) => bull.available_straws > 0)
    .map((bull) => ({
      id: bull.id,
      name: bull.short_name || bull.name,
      breed: bull.breed,
      available_straws: bull.available_straws,
      cost: bull.semen_cost_per_straw,
    }))
    .sort((a, b) => a.name.localeCompare(b.name))
}

/**
 * Deduct semen straw from inventory (called after breeding event)
 */
export async function deductSemenStraw(bullId: string): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()

  // Get user's tenant_id
  const {
    data: { user },
  } = await supabase.auth.getUser()
  const tenantId = user?.user_metadata?.tenant_id

  if (!tenantId) {
    return { success: false, error: 'No tenant ID found' }
  }

  // Find oldest non-expired batch with available straws (FIFO)
  const { data: batches, error: fetchError } = await supabase
    .from('semen_inventory')
    .select('*')
    .eq('bull_id', bullId)
    .eq('tenant_id', tenantId)
    .gt('straws_available', 0)
    .is('deleted_at', null)
    .or(`expiry_date.is.null,expiry_date.gt.${new Date().toISOString().split('T')[0]}`)
    .order('received_date', { ascending: true })
    .limit(1)

  if (fetchError || !batches || batches.length === 0) {
    return { success: false, error: 'No available straws found' }
  }

  const batch = batches[0]

  // Deduct one straw
  const { error: updateError } = await supabase
    .from('semen_inventory')
    .update({
      straws_used: batch.straws_used + 1,
      updated_at: new Date().toISOString(),
    })
    .eq('id', batch.id)

  if (updateError) {
    return { success: false, error: updateError.message }
  }

  return { success: true }
}

/**
 * Get inventory statistics
 */
export async function getInventoryStats(): Promise<{
  total_bulls: number
  active_bulls: number
  total_straws: number
  low_inventory_count: number
}> {
  const bulls = await getBullsWithInventory(false)
  const activeBulls = bulls.filter((b) => b.is_active)
  const lowInventoryBulls = bulls.filter((b) => b.is_active && b.available_straws < 10 && b.available_straws > 0)

  return {
    total_bulls: bulls.length,
    active_bulls: activeBulls.length,
    total_straws: bulls.reduce((sum, b) => sum + b.available_straws, 0),
    low_inventory_count: lowInventoryBulls.length,
  }
}
