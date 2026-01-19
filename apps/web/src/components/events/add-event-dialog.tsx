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
import {
  recordBreeding,
  recordHeat,
  recordPregnancyCheck,
  recordCalving,
  recordDryOff,
  recordTreatment,
  recordVaccination,
  recordBCS,
} from "@/lib/actions/events"

interface AddEventDialogProps {
  animalId: string
  animalEarTag: string
  trigger: React.ReactNode
  defaultEventType?: string
}

const eventTypes = [
  { value: "breeding", label: "Breeding" },
  { value: "heat", label: "Heat Detection" },
  { value: "pregnancy_check", label: "Pregnancy Check" },
  { value: "calving", label: "Calving" },
  { value: "dry_off", label: "Dry Off" },
  { value: "treatment", label: "Treatment" },
  { value: "vaccination", label: "Vaccination" },
  { value: "bcs", label: "BCS Score" },
]

export function AddEventDialog({
  animalId,
  animalEarTag,
  trigger,
  defaultEventType,
}: AddEventDialogProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [eventType, setEventType] = useState(defaultEventType || "")
  const [eventDate, setEventDate] = useState(new Date().toISOString().split("T")[0])

  // Form fields for different event types
  const [formData, setFormData] = useState<Record<string, string>>({})

  const updateFormData = (key: string, value: string) => {
    setFormData((prev) => ({ ...prev, [key]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!eventType) return

    setLoading(true)
    setError(null)

    let result

    switch (eventType) {
      case "breeding":
        result = await recordBreeding({
          animal_id: animalId,
          event_date: eventDate,
          sire_name: formData.sire_name,
          technician: formData.technician,
          notes: formData.notes,
        })
        break
      case "heat":
        result = await recordHeat({
          animal_id: animalId,
          event_date: eventDate,
          score: formData.score ? parseInt(formData.score) : undefined,
          notes: formData.notes,
        })
        break
      case "pregnancy_check":
        result = await recordPregnancyCheck({
          animal_id: animalId,
          event_date: eventDate,
          result: formData.result as "positive" | "negative" | "recheck",
          days_bred: formData.days_bred ? parseInt(formData.days_bred) : undefined,
          technician: formData.technician,
          notes: formData.notes,
        })
        break
      case "calving":
        result = await recordCalving({
          animal_id: animalId,
          event_date: eventDate,
          calf_sex: formData.calf_sex as "male" | "female" | undefined,
          calf_ear_tag: formData.calf_ear_tag,
          ease_score: formData.ease_score ? parseInt(formData.ease_score) : undefined,
          stillborn: formData.stillborn === "true",
          twins: formData.twins === "true",
          notes: formData.notes,
        })
        break
      case "dry_off":
        result = await recordDryOff({
          animal_id: animalId,
          event_date: eventDate,
          reason: formData.reason,
          notes: formData.notes,
        })
        break
      case "treatment":
        result = await recordTreatment({
          animal_id: animalId,
          event_date: eventDate,
          diagnosis: formData.diagnosis || "Not specified",
          drug: formData.drug,
          dose: formData.dose,
          withdrawal_date: formData.withdrawal_date,
          veterinarian: formData.veterinarian,
          notes: formData.notes,
        })
        break
      case "vaccination":
        result = await recordVaccination({
          animal_id: animalId,
          event_date: eventDate,
          vaccine: formData.vaccine || "Not specified",
          dose: formData.dose,
          batch_number: formData.batch_number,
          next_due: formData.next_due,
          notes: formData.notes,
        })
        break
      case "bcs":
        result = await recordBCS({
          animal_id: animalId,
          event_date: eventDate,
          score: parseFloat(formData.score || "3"),
          notes: formData.notes,
        })
        break
    }

    if (result?.error) {
      setError(result.error)
      setLoading(false)
      return
    }

    setLoading(false)
    setOpen(false)
    setFormData({})
    router.refresh()
  }

  const renderEventFields = () => {
    switch (eventType) {
      case "breeding":
        return (
          <>
            <div className="space-y-2">
              <Label htmlFor="sire_name">Sire Name/ID</Label>
              <Input
                id="sire_name"
                value={formData.sire_name || ""}
                onChange={(e) => updateFormData("sire_name", e.target.value)}
                placeholder="Enter sire name or ID"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="technician">Technician</Label>
              <Input
                id="technician"
                value={formData.technician || ""}
                onChange={(e) => updateFormData("technician", e.target.value)}
              />
            </div>
          </>
        )
      case "heat":
        return (
          <div className="space-y-2">
            <Label htmlFor="score">Heat Score (1-5)</Label>
            <Select
              value={formData.score || ""}
              onValueChange={(v) => updateFormData("score", v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select score" />
              </SelectTrigger>
              <SelectContent>
                {[1, 2, 3, 4, 5].map((s) => (
                  <SelectItem key={s} value={s.toString()}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )
      case "pregnancy_check":
        return (
          <>
            <div className="space-y-2">
              <Label htmlFor="result">Result *</Label>
              <Select
                value={formData.result || ""}
                onValueChange={(v) => updateFormData("result", v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select result" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="positive">Positive (Pregnant)</SelectItem>
                  <SelectItem value="negative">Negative (Open)</SelectItem>
                  <SelectItem value="recheck">Recheck needed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="days_bred">Days Since Breeding</Label>
              <Input
                id="days_bred"
                type="number"
                value={formData.days_bred || ""}
                onChange={(e) => updateFormData("days_bred", e.target.value)}
              />
            </div>
          </>
        )
      case "calving":
        return (
          <>
            <div className="space-y-2">
              <Label htmlFor="calf_sex">Calf Sex</Label>
              <Select
                value={formData.calf_sex || ""}
                onValueChange={(v) => updateFormData("calf_sex", v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select sex" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="female">Heifer</SelectItem>
                  <SelectItem value="male">Bull</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="calf_ear_tag">Calf Ear Tag</Label>
              <Input
                id="calf_ear_tag"
                value={formData.calf_ear_tag || ""}
                onChange={(e) => updateFormData("calf_ear_tag", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ease_score">Ease Score (1-5)</Label>
              <Select
                value={formData.ease_score || ""}
                onValueChange={(v) => updateFormData("ease_score", v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select score" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 - No assistance</SelectItem>
                  <SelectItem value="2">2 - Easy pull</SelectItem>
                  <SelectItem value="3">3 - Mechanical</SelectItem>
                  <SelectItem value="4">4 - Hard pull</SelectItem>
                  <SelectItem value="5">5 - C-section</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </>
        )
      case "treatment":
        return (
          <>
            <div className="space-y-2">
              <Label htmlFor="diagnosis">Diagnosis *</Label>
              <Input
                id="diagnosis"
                value={formData.diagnosis || ""}
                onChange={(e) => updateFormData("diagnosis", e.target.value)}
                placeholder="Enter diagnosis"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="drug">Drug/Treatment</Label>
              <Input
                id="drug"
                value={formData.drug || ""}
                onChange={(e) => updateFormData("drug", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="withdrawal_date">Withdrawal End Date</Label>
              <Input
                id="withdrawal_date"
                type="date"
                value={formData.withdrawal_date || ""}
                onChange={(e) => updateFormData("withdrawal_date", e.target.value)}
              />
            </div>
          </>
        )
      case "vaccination":
        return (
          <>
            <div className="space-y-2">
              <Label htmlFor="vaccine">Vaccine *</Label>
              <Input
                id="vaccine"
                value={formData.vaccine || ""}
                onChange={(e) => updateFormData("vaccine", e.target.value)}
                placeholder="Enter vaccine name"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="next_due">Next Due Date</Label>
              <Input
                id="next_due"
                type="date"
                value={formData.next_due || ""}
                onChange={(e) => updateFormData("next_due", e.target.value)}
              />
            </div>
          </>
        )
      case "bcs":
        return (
          <div className="space-y-2">
            <Label htmlFor="score">BCS Score (1.0-5.0) *</Label>
            <Select
              value={formData.score || ""}
              onValueChange={(v) => updateFormData("score", v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select score" />
              </SelectTrigger>
              <SelectContent>
                {[1, 1.5, 2, 2.5, 2.75, 3, 3.25, 3.5, 3.75, 4, 4.5, 5].map((s) => (
                  <SelectItem key={s} value={s.toString()}>
                    {s.toFixed(s % 1 === 0 ? 0 : 2)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )
      case "dry_off":
        return (
          <div className="space-y-2">
            <Label htmlFor="reason">Reason</Label>
            <Input
              id="reason"
              value={formData.reason || ""}
              onChange={(e) => updateFormData("reason", e.target.value)}
              placeholder="Routine, health issue, etc."
            />
          </div>
        )
      default:
        return null
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add Event for #{animalEarTag}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="event_type">Event Type *</Label>
            <Select value={eventType} onValueChange={setEventType}>
              <SelectTrigger>
                <SelectValue placeholder="Select event type" />
              </SelectTrigger>
              <SelectContent>
                {eventTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="event_date">Date *</Label>
            <Input
              id="event_date"
              type="date"
              value={eventDate}
              onChange={(e) => setEventDate(e.target.value)}
              required
            />
          </div>

          {renderEventFields()}

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes || ""}
              onChange={(e) => updateFormData("notes", e.target.value)}
              placeholder="Additional notes..."
              rows={2}
            />
          </div>

          {error && (
            <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">
              {error}
            </div>
          )}

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !eventType}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Event
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
