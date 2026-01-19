import { notFound } from "next/navigation"
import { getAnimalCardData } from "@/lib/data/animal-card"
import { AnimalCardClient } from "@/components/animals/card/animal-card-client"

interface AnimalCardPageProps {
  params: Promise<{ id: string }>
}

export default async function AnimalCardPage({ params }: AnimalCardPageProps) {
  const { id } = await params
  const data = await getAnimalCardData(id)

  if (!data) {
    notFound()
  }

  return <AnimalCardClient data={data} />
}
