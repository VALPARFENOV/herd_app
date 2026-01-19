'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import type { Json } from '@/types/database'

export interface CreateEventInput {
  animal_id: string
  event_type: string
  event_date: string
  event_time?: string | null
  details?: Record<string, unknown>
}

export async function createEvent(data: CreateEventInput) {
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

  const { data: event, error } = await supabase
    .from('events')
    .insert({
      tenant_id: profile.tenant_id,
      animal_id: data.animal_id,
      event_type: data.event_type,
      event_date: data.event_date,
      event_time: data.event_time,
      details: (data.details || {}) as Json,
      created_by: user.id,
    } as never)
    .select()
    .single()

  if (error) {
    return { error: error.message }
  }

  revalidatePath(`/animals/${data.animal_id}`)
  revalidatePath('/animals')
  revalidatePath('/')

  return { data: event }
}

// Breeding event
export async function recordBreeding(data: {
  animal_id: string
  event_date: string
  sire_id?: string
  sire_name?: string
  technician?: string
  notes?: string
}) {
  return createEvent({
    animal_id: data.animal_id,
    event_type: 'breeding',
    event_date: data.event_date,
    details: {
      sire_id: data.sire_id,
      sire_name: data.sire_name,
      technician: data.technician,
      notes: data.notes,
    },
  })
}

// Heat detection
export async function recordHeat(data: {
  animal_id: string
  event_date: string
  score?: number
  notes?: string
}) {
  return createEvent({
    animal_id: data.animal_id,
    event_type: 'heat',
    event_date: data.event_date,
    details: {
      score: data.score,
      notes: data.notes,
    },
  })
}

// Pregnancy check
export async function recordPregnancyCheck(data: {
  animal_id: string
  event_date: string
  result: 'positive' | 'negative' | 'recheck'
  days_bred?: number
  technician?: string
  notes?: string
}) {
  return createEvent({
    animal_id: data.animal_id,
    event_type: 'pregnancy_check',
    event_date: data.event_date,
    details: {
      result: data.result,
      days_bred: data.days_bred,
      technician: data.technician,
      notes: data.notes,
    },
  })
}

// Calving
export async function recordCalving(data: {
  animal_id: string
  event_date: string
  calf_sex?: 'male' | 'female'
  calf_ear_tag?: string
  ease_score?: number
  stillborn?: boolean
  twins?: boolean
  notes?: string
}) {
  return createEvent({
    animal_id: data.animal_id,
    event_type: 'calving',
    event_date: data.event_date,
    details: {
      calf_sex: data.calf_sex,
      calf_ear_tag: data.calf_ear_tag,
      ease_score: data.ease_score,
      stillborn: data.stillborn,
      twins: data.twins,
      notes: data.notes,
    },
  })
}

// Dry off
export async function recordDryOff(data: {
  animal_id: string
  event_date: string
  reason?: string
  notes?: string
}) {
  return createEvent({
    animal_id: data.animal_id,
    event_type: 'dry_off',
    event_date: data.event_date,
    details: {
      reason: data.reason,
      notes: data.notes,
    },
  })
}

// Treatment
export async function recordTreatment(data: {
  animal_id: string
  event_date: string
  diagnosis: string
  drug?: string
  dose?: string
  withdrawal_date?: string
  veterinarian?: string
  notes?: string
}) {
  return createEvent({
    animal_id: data.animal_id,
    event_type: 'treatment',
    event_date: data.event_date,
    details: {
      diagnosis: data.diagnosis,
      drug: data.drug,
      dose: data.dose,
      withdrawal_date: data.withdrawal_date,
      veterinarian: data.veterinarian,
      notes: data.notes,
    },
  })
}

// Vaccination
export async function recordVaccination(data: {
  animal_id: string
  event_date: string
  vaccine: string
  dose?: string
  batch_number?: string
  next_due?: string
  notes?: string
}) {
  return createEvent({
    animal_id: data.animal_id,
    event_type: 'vaccination',
    event_date: data.event_date,
    details: {
      vaccine: data.vaccine,
      dose: data.dose,
      batch_number: data.batch_number,
      next_due: data.next_due,
      notes: data.notes,
    },
  })
}

// BCS (Body Condition Score)
export async function recordBCS(data: {
  animal_id: string
  event_date: string
  score: number
  notes?: string
}) {
  return createEvent({
    animal_id: data.animal_id,
    event_type: 'bcs',
    event_date: data.event_date,
    details: {
      score: data.score,
      notes: data.notes,
    },
  })
}
