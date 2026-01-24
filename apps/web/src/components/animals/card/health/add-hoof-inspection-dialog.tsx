"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
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

interface AddHoofInspectionDialogProps {
  animalId: string
  animalEarTag: string
  trigger?: React.ReactNode
}

const locomotionScores = [
  { value: "1", label: "1 - Normal" },
  { value: "2", label: "2 - Mildly lame" },
  { value: "3", label: "3 - Moderately lame" },
  { value: "4", label: "4 - Lame" },
  { value: "5", label: "5 - Severely lame" },
]

const trimTypes = [
  { value: "routine", label: "Routine Trim" },
  { value: "corrective", label: "Corrective Trim" },
  { value: "therapeutic", label: "Therapeutic Trim" },
]

export function AddHoofInspectionDialog({
  animalId,
  animalEarTag,
  trigger,
}: AddHoofInspectionDialogProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    inspection_date: new Date().toISOString().split("T")[0],
    locomotion_score: "1",
    trim_type: "routine",
    trimmer_name: "",
    notes: "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/hoof-inspections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          animal_id: animalId,
          inspection_date: formData.inspection_date,
          locomotion_score: parseInt(formData.locomotion_score),
          trim_type: formData.trim_type,
          trimmer_name: formData.trimmer_name || null,
          notes: formData.notes || null,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to save hoof inspection")
      }

      setOpen(false)
      router.refresh()

      // Reset form
      setFormData({
        inspection_date: new Date().toISOString().split("T")[0],
        locomotion_score: "1",
        trim_type: "routine",
        trimmer_name: "",
        notes: "",
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save hoof inspection")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || <Button size="sm">Add Inspection</Button>}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Hoof Inspection - {animalEarTag}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="inspection_date">Inspection Date *</Label>
            <Input
              id="inspection_date"
              type="date"
              value={formData.inspection_date}
              onChange={(e) =>
                setFormData({ ...formData, inspection_date: e.target.value })
              }
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="locomotion_score">Locomotion Score *</Label>
            <Select
              value={formData.locomotion_score}
              onValueChange={(value) =>
                setFormData({ ...formData, locomotion_score: value })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {locomotionScores.map((score) => (
                  <SelectItem key={score.value} value={score.value}>
                    {score.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="trim_type">Trim Type *</Label>
            <Select
              value={formData.trim_type}
              onValueChange={(value) => setFormData({ ...formData, trim_type: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {trimTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="trimmer_name">Trimmer Name</Label>
            <Input
              id="trimmer_name"
              value={formData.trimmer_name}
              onChange={(e) =>
                setFormData({ ...formData, trimmer_name: e.target.value })
              }
              placeholder="Name of hoof trimmer"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Findings, lesions, treatment recommendations..."
              rows={3}
            />
            <p className="text-xs text-muted-foreground">
              Note: Detailed lesion mapping can be added after saving
            </p>
          </div>

          {error && (
            <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">
              {error}
            </div>
          )}

          <div className="flex gap-2 justify-end">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Inspection
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
