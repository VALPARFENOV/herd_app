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

interface AddUdderTestDialogProps {
  animalId: string
  animalEarTag: string
  trigger?: React.ReactNode
}

const testTypes = [
  { value: "scc", label: "SCC (Somatic Cell Count)" },
  { value: "cmt", label: "CMT (California Mastitis Test)" },
  { value: "culture", label: "Bacterial Culture" },
  { value: "pcr", label: "PCR Test" },
]

const cmtScores = [
  { value: "negative", label: "Negative" },
  { value: "trace", label: "Trace" },
  { value: "1", label: "1 (Weak positive)" },
  { value: "2", label: "2 (Distinct positive)" },
  { value: "3", label: "3 (Strong positive)" },
]

export function AddUdderTestDialog({
  animalId,
  animalEarTag,
  trigger,
}: AddUdderTestDialogProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    test_date: new Date().toISOString().split("T")[0],
    test_type: "scc",
    // SCC values per quarter
    lf_scc: "",
    lr_scc: "",
    rf_scc: "",
    rr_scc: "",
    // CMT scores per quarter
    lf_cmt: "",
    lr_cmt: "",
    rf_cmt: "",
    rr_cmt: "",
    // Culture results
    lf_pathogen: "",
    lr_pathogen: "",
    rf_pathogen: "",
    rr_pathogen: "",
    notes: "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/udder-tests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          animal_id: animalId,
          test_date: formData.test_date,
          test_type: formData.test_type,
          lf_scc: formData.lf_scc ? parseInt(formData.lf_scc) : null,
          lr_scc: formData.lr_scc ? parseInt(formData.lr_scc) : null,
          rf_scc: formData.rf_scc ? parseInt(formData.rf_scc) : null,
          rr_scc: formData.rr_scc ? parseInt(formData.rr_scc) : null,
          lf_cmt: formData.lf_cmt || null,
          lr_cmt: formData.lr_cmt || null,
          rf_cmt: formData.rf_cmt || null,
          rr_cmt: formData.rr_cmt || null,
          lf_pathogen: formData.lf_pathogen || null,
          lr_pathogen: formData.lr_pathogen || null,
          rf_pathogen: formData.rf_pathogen || null,
          rr_pathogen: formData.rr_pathogen || null,
          notes: formData.notes || null,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to save udder test")
      }

      setOpen(false)
      router.refresh()

      // Reset form
      setFormData({
        test_date: new Date().toISOString().split("T")[0],
        test_type: "scc",
        lf_scc: "",
        lr_scc: "",
        rf_scc: "",
        rr_scc: "",
        lf_cmt: "",
        lr_cmt: "",
        rf_cmt: "",
        rr_cmt: "",
        lf_pathogen: "",
        lr_pathogen: "",
        rf_pathogen: "",
        rr_pathogen: "",
        notes: "",
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save udder test")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || <Button size="sm">Add Test</Button>}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Udder Quarter Test - {animalEarTag}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="test_date">Test Date *</Label>
            <Input
              id="test_date"
              type="date"
              value={formData.test_date}
              onChange={(e) => setFormData({ ...formData, test_date: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="test_type">Test Type *</Label>
            <Select
              value={formData.test_type}
              onValueChange={(value) => setFormData({ ...formData, test_type: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {testTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {formData.test_type === "scc" && (
            <div className="space-y-3">
              <Label className="text-base font-semibold">
                SCC by Quarter (cells/ml × 1000)
              </Label>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="lf_scc" className="text-sm">
                    Left Front
                  </Label>
                  <Input
                    id="lf_scc"
                    type="number"
                    min="0"
                    value={formData.lf_scc}
                    onChange={(e) => setFormData({ ...formData, lf_scc: e.target.value })}
                    placeholder="e.g., 150"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lr_scc" className="text-sm">
                    Left Rear
                  </Label>
                  <Input
                    id="lr_scc"
                    type="number"
                    min="0"
                    value={formData.lr_scc}
                    onChange={(e) => setFormData({ ...formData, lr_scc: e.target.value })}
                    placeholder="e.g., 200"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="rf_scc" className="text-sm">
                    Right Front
                  </Label>
                  <Input
                    id="rf_scc"
                    type="number"
                    min="0"
                    value={formData.rf_scc}
                    onChange={(e) => setFormData({ ...formData, rf_scc: e.target.value })}
                    placeholder="e.g., 180"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="rr_scc" className="text-sm">
                    Right Rear
                  </Label>
                  <Input
                    id="rr_scc"
                    type="number"
                    min="0"
                    value={formData.rr_scc}
                    onChange={(e) => setFormData({ ...formData, rr_scc: e.target.value })}
                    placeholder="e.g., 220"
                  />
                </div>
              </div>
            </div>
          )}

          {formData.test_type === "cmt" && (
            <div className="space-y-3">
              <Label className="text-base font-semibold">CMT Score by Quarter</Label>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="lf_cmt" className="text-sm">
                    Left Front
                  </Label>
                  <Select
                    value={formData.lf_cmt}
                    onValueChange={(value) => setFormData({ ...formData, lf_cmt: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select score" />
                    </SelectTrigger>
                    <SelectContent>
                      {cmtScores.map((score) => (
                        <SelectItem key={score.value} value={score.value}>
                          {score.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lr_cmt" className="text-sm">
                    Left Rear
                  </Label>
                  <Select
                    value={formData.lr_cmt}
                    onValueChange={(value) => setFormData({ ...formData, lr_cmt: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select score" />
                    </SelectTrigger>
                    <SelectContent>
                      {cmtScores.map((score) => (
                        <SelectItem key={score.value} value={score.value}>
                          {score.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="rf_cmt" className="text-sm">
                    Right Front
                  </Label>
                  <Select
                    value={formData.rf_cmt}
                    onValueChange={(value) => setFormData({ ...formData, rf_cmt: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select score" />
                    </SelectTrigger>
                    <SelectContent>
                      {cmtScores.map((score) => (
                        <SelectItem key={score.value} value={score.value}>
                          {score.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="rr_cmt" className="text-sm">
                    Right Rear
                  </Label>
                  <Select
                    value={formData.rr_cmt}
                    onValueChange={(value) => setFormData({ ...formData, rr_cmt: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select score" />
                    </SelectTrigger>
                    <SelectContent>
                      {cmtScores.map((score) => (
                        <SelectItem key={score.value} value={score.value}>
                          {score.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}

          {formData.test_type === "culture" && (
            <div className="space-y-3">
              <Label className="text-base font-semibold">Pathogen by Quarter</Label>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="lf_pathogen" className="text-sm">
                    Left Front
                  </Label>
                  <Input
                    id="lf_pathogen"
                    value={formData.lf_pathogen}
                    onChange={(e) =>
                      setFormData({ ...formData, lf_pathogen: e.target.value })
                    }
                    placeholder="e.g., S. aureus"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lr_pathogen" className="text-sm">
                    Left Rear
                  </Label>
                  <Input
                    id="lr_pathogen"
                    value={formData.lr_pathogen}
                    onChange={(e) =>
                      setFormData({ ...formData, lr_pathogen: e.target.value })
                    }
                    placeholder="e.g., E. coli"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="rf_pathogen" className="text-sm">
                    Right Front
                  </Label>
                  <Input
                    id="rf_pathogen"
                    value={formData.rf_pathogen}
                    onChange={(e) =>
                      setFormData({ ...formData, rf_pathogen: e.target.value })
                    }
                    placeholder="e.g., Strep. uberis"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="rr_pathogen" className="text-sm">
                    Right Rear
                  </Label>
                  <Input
                    id="rr_pathogen"
                    value={formData.rr_pathogen}
                    onChange={(e) =>
                      setFormData({ ...formData, rr_pathogen: e.target.value })
                    }
                    placeholder="e.g., Negative"
                  />
                </div>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Additional observations, treatment recommendations..."
              rows={3}
            />
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
              Save Test
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
