'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { InsertTables, UpdateTables } from '@/types/database'

export async function createAnimal(data: Omit<InsertTables<'animals'>, 'tenant_id'>) {
  const supabase = await createClient()

  // Get user's tenant_id
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: 'Not authenticated' }
  }

  const { data: profileData } = await supabase
    .from('profiles')
    .select('tenant_id')
    .eq('id', user.id)
    .single()

  const profile = profileData as { tenant_id: string } | null
  if (!profile) {
    return { error: 'User profile not found' }
  }

  const { data: animal, error } = await supabase
    .from('animals')
    .insert({
      ...data,
      tenant_id: profile.tenant_id,
    } as never)
    .select()
    .single()

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/animals')
  return { data: animal }
}

export async function updateAnimal(id: string, data: UpdateTables<'animals'>) {
  const supabase = await createClient()

  const { data: animal, error } = await supabase
    .from('animals')
    .update(data as never)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/animals')
  revalidatePath(`/animals/${id}`)
  return { data: animal }
}

export async function deleteAnimal(id: string) {
  const supabase = await createClient()

  // Soft delete
  const { error } = await supabase
    .from('animals')
    .update({ deleted_at: new Date().toISOString() } as never)
    .eq('id', id)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/animals')
  return { success: true }
}

export async function getPens() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('pens')
    .select('id, name, barn_id, barns(name)')
    .order('name')

  if (error) {
    return []
  }

  return (data || []) as any
}
