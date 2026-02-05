import { notFound } from "next/navigation"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { AnimalForm } from "@/components/animals/animal-form"
import { getAnimalById } from "@/lib/data/animals"
import { getPens } from "@/lib/actions/animals"

interface EditAnimalPageProps {
  params: Promise<{ id: string }>
}

export default async function EditAnimalPage({ params }: EditAnimalPageProps) {
  const { id } = await params
  const animal = await getAnimalById(id)

  if (!animal) {
    notFound()
  }

  const pens = await getPens()

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href={`/animals/${id}`}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Edit Animal #{animal.ear_tag}</h1>
          <p className="text-muted-foreground">Update the animal details below</p>
        </div>
      </div>

      <AnimalForm animal={animal} pens={pens} mode="edit" />
    </div>
  )
}
