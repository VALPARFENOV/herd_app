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

interface AddMilkReadingDialogProps {
  animalId: string
  animalEarTag: string
  trigger?: React.ReactNode
}

const sessions = [
  { value: "morning", label: "Morning" },
  { value: "afternoon", label: "Afternoon" },
  { value: "evening", label: "Evening" },
]

export function AddMilkReadingDialog({
  animalId,
  animalEarTag,
  trigger,
}: AddMilkReadingDialogProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    date: new Date().toISOString().split("T")[0],
    time: new Date().toTimeString().slice(0, 5),
    session_id: "morning",
    milk_kg: "",
    duration_seconds: "",
    avg_flow_rate: "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const timestamp = `${formData.date}T${formData.time}:00`

      const response = await fetch("/api/milk-readings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          animal_id: animalId,
          time: timestamp,
          session_id: formData.session_id,
          milk_kg: parseFloat(formData.milk_kg),
          duration_seconds: formData.duration_seconds
            ? parseInt(formData.duration_seconds)
            : null,
          avg_flow_rate: formData.avg_flow_rate
            ? parseFloat(formData.avg_flow_rate)
            : null,
          source: "manual",
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to save milk reading")
      }

      setOpen(false)
      router.refresh()

      // Reset form
      setFormData({
        date: new Date().toISOString().split("T")[0],
        time: new Date().toTimeString().slice(0, 5),
        session_id: "morning",
        milk_kg: "",
        duration_seconds: "",
        avg_flow_rate: "",
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save milk reading")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || <Button size="sm">Add Milk Reading</Button>}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add Milk Reading - {animalEarTag}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date">Date *</Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="time">Time *</Label>
              <Input
                id="time"
                type="time"
                value={formData.time}
                onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="session_id">Session *</Label>
            <Select
              value={formData.session_id}
              onValueChange={(value) => setFormData({ ...formData, session_id: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {sessions.map((session) => (
                  <SelectItem key={session.value} value={session.value}>
                    {session.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="milk_kg">Milk Yield (kg) *</Label>
            <Input
              id="milk_kg"
              type="number"
              step="0.1"
              min="0"
              value={formData.milk_kg}
              onChange={(e) => setFormData({ ...formData, milk_kg: e.target.value })}
              placeholder="e.g., 12.5"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="duration_seconds">Duration (seconds)</Label>
              <Input
                id="duration_seconds"
                type="number"
                min="0"
                value={formData.duration_seconds}
                onChange={(e) =>
                  setFormData({ ...formData, duration_seconds: e.target.value })
                }
                placeholder="e.g., 360"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="avg_flow_rate">Avg Flow (kg/min)</Label>
              <Input
                id="avg_flow_rate"
                type="number"
                step="0.01"
                min="0"
                value={formData.avg_flow_rate}
                onChange={(e) =>
                  setFormData({ ...formData, avg_flow_rate: e.target.value })
                }
                placeholder="e.g., 2.5"
              />
            </div>
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
              Save Reading
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
