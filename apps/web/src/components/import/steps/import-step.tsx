"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2, CheckCircle2, XCircle, Download } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { createClient } from "@/lib/supabase/client"
import type { ParsedData, FieldMapping, ValidationResult } from "../import-wizard"

interface ImportStepProps {
  data: ParsedData
  mapping: FieldMapping
  validation: ValidationResult
  targetEntity: string
  onComplete: (count: number) => void
  importComplete: boolean
  importedCount: number
  onBack: () => void
}

export function ImportStep({
  data,
  mapping,
  validation,
  targetEntity,
  onComplete,
  importComplete,
  importedCount,
  onBack,
}: ImportStepProps) {
  const router = useRouter()
  const [importing, setImporting] = useState(!importComplete)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [imported, setImported] = useState(importComplete ? importedCount : 0)
  const [failed, setFailed] = useState(0)

  useEffect(() => {
    if (importComplete) return

    const runImport = async () => {
      const supabase = createClient()

      // Get user's tenant_id first
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setError("Not authenticated")
        setImporting(false)
        return
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("tenant_id")
        .eq("id", user.id)
        .single()

      if (!profile) {
        setError("User profile not found")
        setImporting(false)
        return
      }

      const tenantId = (profile as { tenant_id: string }).tenant_id

      // Get error row numbers
      const errorRowNums = new Set(
        validation.errors.filter((e) => !e.isWarning).map((e) => e.row)
      )

      // Filter valid rows
      const validRows = data.rows
        .map((row, idx) => ({ row, rowNum: idx + 1 }))
        .filter(({ rowNum }) => !errorRowNums.has(rowNum))

      const totalToImport = validRows.length
      let successCount = 0
      let failCount = 0
      const batchSize = 50

      // Import in batches
      for (let i = 0; i < validRows.length; i += batchSize) {
        const batch = validRows.slice(i, i + batchSize)

        const animalsToInsert = batch.map(({ row }) => {
          const animal: Record<string, unknown> = {
            tenant_id: tenantId,
          }

          for (const [sourceCol, targetField] of Object.entries(mapping)) {
            if (!targetField) continue

            let value: unknown = row[sourceCol]

            // Transform values as needed
            if (targetField === "birth_date" || targetField === "last_calving_date") {
              value = parseDate(value as string)
            } else if (targetField === "lactation_number") {
              value = parseInt(value as string) || 0
            } else if (targetField === "sex") {
              value = normalizeSex(value as string)
            } else if (targetField === "current_status") {
              value = normalizeStatus(value as string)
            }

            // Skip pen_name (needs lookup) for now
            if (targetField !== "pen_name") {
              animal[targetField] = value || null
            }
          }

          return animal
        })

        const { data: inserted, error: insertError } = await supabase
          .from("animals")
          .insert(animalsToInsert as never[])
          .select("id")

        if (insertError) {
          console.error("Batch insert error:", insertError)
          failCount += batch.length
        } else {
          successCount += inserted?.length || 0
        }

        setImported(successCount)
        setFailed(failCount)
        setProgress(Math.round(((i + batch.length) / totalToImport) * 100))

        // Small delay to not overwhelm the UI
        await new Promise((resolve) => setTimeout(resolve, 50))
      }

      setImporting(false)
      onComplete(successCount)
    }

    runImport()
  }, [data, mapping, validation, importComplete])

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {importing ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              Importing...
            </>
          ) : error ? (
            <>
              <XCircle className="h-5 w-5 text-red-500" />
              Import Failed
            </>
          ) : (
            <>
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              Import Complete
            </>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {importing ? (
          <div className="space-y-4">
            <Progress value={progress} />
            <div className="text-center">
              <p className="text-lg font-medium">{imported} animals imported</p>
              <p className="text-sm text-muted-foreground">
                Processing {validation.validRows} rows...
              </p>
            </div>
          </div>
        ) : error ? (
          <div className="text-center py-8">
            <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <p className="text-lg font-medium text-red-700">Import Failed</p>
            <p className="text-sm text-muted-foreground mt-2">{error}</p>
            <Button variant="outline" onClick={onBack} className="mt-4">
              Go Back
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="text-center py-8">
              <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto mb-4" />
              <p className="text-2xl font-bold text-green-700">{imported} Animals Imported</p>
              {failed > 0 && (
                <p className="text-sm text-red-600 mt-2">{failed} rows failed to import</p>
              )}
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-center">
                <div className="text-2xl font-bold text-green-700">{imported}</div>
                <div className="text-sm text-green-600">Imported</div>
              </div>
              <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg text-center">
                <div className="text-2xl font-bold text-gray-700">{validation.errorRows}</div>
                <div className="text-sm text-gray-600">Skipped (errors)</div>
              </div>
              <div className="p-4 bg-muted rounded-lg text-center">
                <div className="text-2xl font-bold">{data.totalRows}</div>
                <div className="text-sm text-muted-foreground">Total Rows</div>
              </div>
            </div>

            <div className="flex justify-center gap-4">
              <Button variant="outline" onClick={() => router.push("/settings/import")}>
                Import More
              </Button>
              <Button onClick={() => router.push("/animals")}>
                View Animals
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function parseDate(value: string): string | null {
  if (!value) return null

  // Try DD.MM.YYYY format (Russian)
  const ddmmyyyy = value.match(/^(\d{2})\.(\d{2})\.(\d{4})$/)
  if (ddmmyyyy) {
    return `${ddmmyyyy[3]}-${ddmmyyyy[2]}-${ddmmyyyy[1]}`
  }

  // Try DD/MM/YYYY format
  const slashFormat = value.match(/^(\d{2})\/(\d{2})\/(\d{4})$/)
  if (slashFormat) {
    return `${slashFormat[3]}-${slashFormat[2]}-${slashFormat[1]}`
  }

  // Try YYYY-MM-DD format (ISO)
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return value
  }

  return value
}

function normalizeSex(value: string): "male" | "female" {
  const v = value?.toLowerCase().trim()
  if (["m", "male", "бык", "bull"].includes(v)) return "male"
  return "female"
}

function normalizeStatus(value: string): string {
  const v = value?.toLowerCase().trim()
  if (["lactating", "milking", "дойная"].includes(v)) return "lactating"
  if (["dry", "сухостой", "сухостойная"].includes(v)) return "dry"
  if (["fresh", "новотельная"].includes(v)) return "fresh"
  if (["heifer", "тёлка", "нетель"].includes(v)) return "heifer"
  return "heifer" // default
}
