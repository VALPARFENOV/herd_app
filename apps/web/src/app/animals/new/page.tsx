import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { AnimalForm } from "@/components/animals/animal-form"
import { getPens } from "@/lib/actions/animals"

export default async function NewAnimalPage() {
  const pens = await getPens()

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/animals">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Add New Animal</h1>
          <p className="text-muted-foreground">Enter the animal details below</p>
        </div>
      </div>

      <AnimalForm pens={pens} mode="create" />
    </div>
  )
}
