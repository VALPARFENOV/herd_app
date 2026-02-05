import { createClient } from '@/lib/supabase/server'
import type { Event, Json } from '@/types/database'

export interface EventWithDetails extends Event {
  eventLabel: string
  eventDescription: string
}

const eventLabels: Record<string, string> = {
  calving: 'Calving',
  breeding: 'Breeding',
  heat: 'Heat Detected',
  pregnancy_check: 'Pregnancy Check',
  dry_off: 'Dry Off',
  treatment: 'Treatment',
  vaccination: 'Vaccination',
  bcs: 'BCS Score',
  sold: 'Sold',
  culled: 'Culled',
  dead: 'Deceased',
}

function getEventDescription(event: Event): string {
  const details = event.details as Record<string, unknown>

  switch (event.event_type) {
    case 'calving':
      return details.calf_sex
        ? `${details.calf_sex === 'male' ? 'Bull' : 'Heifer'} calf${details.calf_ear_tag ? ` #${details.calf_ear_tag}` : ''}`
        : 'Calving recorded'
    case 'breeding':
      return details.sire_name
        ? `Bred to ${details.sire_name}`
        : 'Breeding recorded'
    case 'heat':
      return details.score ? `Heat score: ${details.score}` : 'Heat detected'
    case 'pregnancy_check':
      return details.result === 'positive'
        ? 'Confirmed pregnant'
        : details.result === 'negative'
        ? 'Not pregnant'
        : 'Check performed'
    case 'treatment':
      return details.diagnosis
        ? `${details.diagnosis}${details.drug ? ` - ${details.drug}` : ''}`
        : 'Treatment recorded'
    case 'vaccination':
      return details.vaccine ? `${details.vaccine}` : 'Vaccination recorded'
    case 'bcs':
      return details.score ? `Score: ${details.score}` : 'BCS recorded'
    case 'dry_off':
      return 'Dried off'
    default:
      return 'Event recorded'
  }
}

export function enrichEvent(event: Event): EventWithDetails {
  return {
    ...event,
    eventLabel: eventLabels[event.event_type] || event.event_type,
    eventDescription: getEventDescription(event),
  }
}

export async function getEventsByAnimalId(
  animalId: string,
  options?: {
    limit?: number
    eventTypes?: string[]
  }
): Promise<EventWithDetails[]> {
  const supabase = await createClient()

  let query = supabase
    .from('events')
    .select('*')
    .eq('animal_id', animalId)
    .order('event_date', { ascending: false })

  if (options?.eventTypes && options.eventTypes.length > 0) {
    query = query.in('event_type', options.eventTypes)
  }

  if (options?.limit) {
    query = query.limit(options.limit)
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching events:', error)
    return []
  }

  return (data || []).map(enrichEvent)
}

export async function getRecentEvents(options?: {
  limit?: number
  eventTypes?: string[]
}): Promise<(EventWithDetails & { animal_ear_tag?: string })[]> {
  const supabase = await createClient()

  let query = supabase
    .from('events')
    .select('*, animals(ear_tag)')
    .order('event_date', { ascending: false })
    .order('created_at', { ascending: false })

  if (options?.eventTypes && options.eventTypes.length > 0) {
    query = query.in('event_type', options.eventTypes)
  }

  if (options?.limit) {
    query = query.limit(options.limit)
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching recent events:', error)
    return []
  }

  return ((data || []) as any[]).map((event: Event & { animals: { ear_tag: string } | null }) => {
    const { animals, ...eventData } = event
    return {
      ...enrichEvent(eventData),
      animal_ear_tag: animals?.ear_tag,
    }
  })
}

export async function getBreedingHistory(animalId: string): Promise<EventWithDetails[]> {
  return getEventsByAnimalId(animalId, {
    eventTypes: ['breeding', 'heat', 'pregnancy_check'],
  })
}

export async function getTreatmentHistory(animalId: string): Promise<EventWithDetails[]> {
  return getEventsByAnimalId(animalId, {
    eventTypes: ['treatment', 'vaccination'],
  })
}
