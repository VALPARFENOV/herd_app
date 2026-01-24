"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { createAnimal, updateAnimal } from "@/lib/actions/animals"
import type { Animal, Pen } from "@/types/database"

interface AnimalFormProps {
  animal?: Animal | null
  pens: (Pen & { barns: { name: string } | null })[]
  mode: "create" | "edit"
}

const breeds = [
  "Holstein",
  "Jersey",
  "Brown Swiss",
  "Simmental",
  "Ayrshire",
  "Guernsey",
  "Red Holstein",
  "Other",
]

const statuses = [
  { value: "heifer", label: "Heifer" },
  { value: "lactating", label: "Lactating" },
  { value: "fresh", label: "Fresh" },
  { value: "dry", label: "Dry" },
]

export function AnimalForm({ animal, pens, mode }: AnimalFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    ear_tag: animal?.ear_tag || "",
    name: animal?.name || "",
    birth_date: animal?.birth_date || "",
    breed: animal?.breed || "Holstein",
    sex: animal?.sex || "female",
    current_status: animal?.current_status || "heifer",
    pen_id: animal?.pen_id || "",
    registration_number: animal?.registration_number || "",
    electronic_id: animal?.electronic_id || "",
    sire_registration: animal?.sire_registration || "",
    dam_registration: animal?.dam_registration || "",
    lactation_number: animal?.lactation_number || 0,
    notes: animal?.notes || "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const submitData = {
      ...formData,
      pen_id: formData.pen_id || null,
      name: formData.name || null,
      registration_number: formData.registration_number || null,
      electronic_id: formData.electronic_id || null,
      sire_registration: formData.sire_registration || null,
      dam_registration: formData.dam_registration || null,
      notes: formData.notes || null,
    }

    let result
    if (mode === "create") {
      result = await createAnimal(submitData)
    } else if (animal) {
      result = await updateAnimal(animal.id, submitData)
    }

    if (result?.error) {
      setError(result.error)
      setLoading(false)
      return
    }

    router.push("/animals")
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Basic Information</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="ear_tag">Ear Tag *</Label>
            <Input
              id="ear_tag"
              value={formData.ear_tag}
              onChange={(e) => setFormData({ ...formData, ear_tag: e.target.value })}
              required
              placeholder="e.g., 1001"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., Bella"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="birth_date">Birth Date *</Label>
            <Input
              id="birth_date"
              type="date"
              value={formData.birth_date}
              onChange={(e) => setFormData({ ...formData, birth_date: e.target.value })}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="breed">Breed *</Label>
            <Select
              value={formData.breed}
              onValueChange={(value) => setFormData({ ...formData, breed: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select breed" />
              </SelectTrigger>
              <SelectContent>
                {breeds.map((breed) => (
                  <SelectItem key={breed} value={breed}>
                    {breed}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="sex">Sex *</Label>
            <Select
              value={formData.sex}
              onValueChange={(value) => setFormData({ ...formData, sex: value as "male" | "female" })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select sex" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="female">Female</SelectItem>
                <SelectItem value="male">Male</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="current_status">Status *</Label>
            <Select
              value={formData.current_status}
              onValueChange={(value) => setFormData({ ...formData, current_status: value as typeof formData.current_status })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                {statuses.map((status) => (
                  <SelectItem key={status.value} value={status.value}>
                    {status.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="pen_id">Pen</Label>
            <Select
              value={formData.pen_id || undefined}
              onValueChange={(value) => setFormData({ ...formData, pen_id: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="No pen (optional)" />
              </SelectTrigger>
              <SelectContent>
                {pens.map((pen) => (
                  <SelectItem key={pen.id} value={pen.id}>
                    {pen.name} {pen.barns ? `(${pen.barns.name})` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="lactation_number">Lactation Number</Label>
            <Input
              id="lactation_number"
              type="number"
              min="0"
              value={formData.lactation_number}
              onChange={(e) => setFormData({ ...formData, lactation_number: parseInt(e.target.value) || 0 })}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Identification</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="registration_number">Registration Number</Label>
            <Input
              id="registration_number"
              value={formData.registration_number}
              onChange={(e) => setFormData({ ...formData, registration_number: e.target.value })}
              placeholder="Official registration"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="electronic_id">Electronic ID (RFID)</Label>
            <Input
              id="electronic_id"
              value={formData.electronic_id}
              onChange={(e) => setFormData({ ...formData, electronic_id: e.target.value })}
              placeholder="RFID tag number"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Pedigree</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="sire_registration">Sire Registration</Label>
            <Input
              id="sire_registration"
              value={formData.sire_registration}
              onChange={(e) => setFormData({ ...formData, sire_registration: e.target.value })}
              placeholder="Father's registration number"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="dam_registration">Dam Registration</Label>
            <Input
              id="dam_registration"
              value={formData.dam_registration}
              onChange={(e) => setFormData({ ...formData, dam_registration: e.target.value })}
              placeholder="Mother's registration number"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Notes</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            placeholder="Additional notes about this animal..."
            rows={4}
          />
        </CardContent>
      </Card>

      {error && (
        <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">
          {error}
        </div>
      )}

      <div className="flex gap-4">
        <Button type="submit" disabled={loading}>
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {mode === "create" ? "Create Animal" : "Save Changes"}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancel
        </Button>
      </div>
    </form>
  )
}
