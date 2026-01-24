import { getAnimals, getAnimalStats } from "@/lib/data/animals"
import { AnimalsListClient } from "@/components/animals/animals-list-client"

interface AnimalsPageProps {
  searchParams: Promise<{
    filter?: 'fresh' | 'to_breed' | 'preg_check' | 'dry_off' | 'vet'
    status?: 'lactating' | 'dry' | 'heifer' | 'fresh'
    search?: string
  }>
}

export default async function AnimalsPage({ searchParams }: AnimalsPageProps) {
  const params = await searchParams
  const [{ data: animals }, stats] = await Promise.all([
    getAnimals({
      limit: 100,
      filter: params.filter,
      status: params.status,
      search: params.search,
    }),
    getAnimalStats(),
  ])

  return <AnimalsListClient animals={animals} stats={stats} />
}
