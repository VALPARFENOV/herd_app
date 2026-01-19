import { getAnimals, getAnimalStats } from "@/lib/data/animals"
import { AnimalsListClient } from "@/components/animals/animals-list-client"

export default async function AnimalsPage() {
  const [{ data: animals }, stats] = await Promise.all([
    getAnimals({ limit: 100 }),
    getAnimalStats(),
  ])

  return <AnimalsListClient animals={animals} stats={stats} />
}
