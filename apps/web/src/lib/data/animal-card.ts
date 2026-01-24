import { getAnimalById, AnimalWithComputed } from './animals'
import { getEventsByAnimalId, EventWithDetails } from './events'
import { getLactationsByAnimalId, getCurrentLactation } from './lactations'
import { getHoofInspections, type HoofInspection } from './hoof-care'
import { getUdderTestSessions, type UdderTestSession } from './udder-health'
import type { Lactation } from '@/types/database'

export interface AnimalCardData {
  animal: AnimalWithComputed
  events: EventWithDetails[]
  lactations: Lactation[]
  currentLactation: Lactation | null
  hoofInspections: HoofInspection[]
  udderTestSessions: UdderTestSession[]
}

export async function getAnimalCardData(id: string): Promise<AnimalCardData | null> {
  const animal = await getAnimalById(id)

  if (!animal) {
    return null
  }

  const [events, lactations, currentLactation, hoofInspections, udderTestSessions] = await Promise.all([
    getEventsByAnimalId(id, { limit: 50 }),
    getLactationsByAnimalId(id),
    getCurrentLactation(id),
    getHoofInspections(id),
    getUdderTestSessions(id),
  ])

  return {
    animal,
    events,
    lactations,
    currentLactation,
    hoofInspections,
    udderTestSessions,
  }
}
