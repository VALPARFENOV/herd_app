"use client"

import { useEffect, useState } from "react"
import { Loader2, CheckCircle2 } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import type { ParsedData, FieldMapping } from "../import-wizard"

interface AnalyzeStepProps {
  data: ParsedData
  targetEntity: string
  onComplete: (autoMapping: FieldMapping) => void
  onBack: () => void
}

// Target fields for animals
const animalFields = [
  { key: "ear_tag", label: "Ear Tag", required: true },
  { key: "name", label: "Name", required: false },
  { key: "birth_date", label: "Birth Date", required: true },
  { key: "breed", label: "Breed", required: true },
  { key: "sex", label: "Sex", required: false },
  { key: "current_status", label: "Status", required: false },
  { key: "lactation_number", label: "Lactation Number", required: false },
  { key: "pen_name", label: "Pen", required: false },
  { key: "registration_number", label: "Registration Number", required: false },
  { key: "electronic_id", label: "Electronic ID", required: false },
  { key: "sire_registration", label: "Sire Registration", required: false },
  { key: "dam_registration", label: "Dam Registration", required: false },
  { key: "last_calving_date", label: "Last Calving Date", required: false },
  { key: "notes", label: "Notes", required: false },
]

// Common column name variations for auto-mapping
const fieldAliases: Record<string, string[]> = {
  ear_tag: ["ear_tag", "eartag", "id", "number", "номер", "ушной номер", "ear tag"],
  name: ["name", "кличка", "имя"],
  birth_date: ["birth_date", "birthdate", "bdat", "дата рождения", "birth"],
  breed: ["breed", "порода"],
  sex: ["sex", "пол", "gender"],
  current_status: ["status", "stat", "статус", "current_status"],
  lactation_number: ["lactation", "lact", "лактация", "lactation_number", "l#"],
  pen_name: ["pen", "секция", "группа", "pen_name"],
  registration_number: ["registration", "reg", "registration_number", "регистрация"],
  electronic_id: ["rfid", "electronic_id", "electronic", "chip"],
  sire_registration: ["sire", "отец", "sire_registration", "sire_id"],
  dam_registration: ["dam", "мать", "dam_registration", "dam_id"],
  last_calving_date: ["calving", "fdat", "last_calving", "last_calving_date", "дата отёла"],
  notes: ["notes", "note", "примечания", "комментарий"],
}

function autoDetectMapping(headers: string[]): FieldMapping {
  const mapping: FieldMapping = {}

  headers.forEach((header) => {
    const normalizedHeader = header.toLowerCase().trim()

    for (const [field, aliases] of Object.entries(fieldAliases)) {
      if (aliases.some((alias) => normalizedHeader === alias || normalizedHeader.includes(alias))) {
        mapping[header] = field
        break
      }
    }

    if (!mapping[header]) {
      mapping[header] = null // Skip by default if not recognized
    }
  })

  return mapping
}

export function AnalyzeStep({ data, targetEntity, onComplete, onBack }: AnalyzeStepProps) {
  const [analyzing, setAnalyzing] = useState(true)
  const [detectedTypes, setDetectedTypes] = useState<Record<string, string>>({})
  const [autoMapping, setAutoMapping] = useState<FieldMapping>({})

  useEffect(() => {
    // Simulate analysis (detect data types, auto-map columns)
    const timer = setTimeout(() => {
      const mapping = autoDetectMapping(data.headers)
      setAutoMapping(mapping)

      // Detect data types by sampling first few rows
      const types: Record<string, string> = {}
      data.headers.forEach((header) => {
        const sample = data.rows.slice(0, 10).map((row) => row[header])
        types[header] = detectDataType(sample)
      })
      setDetectedTypes(types)

      setAnalyzing(false)
    }, 1000)

    return () => clearTimeout(timer)
  }, [data])

  const mappedCount = Object.values(autoMapping).filter((v) => v !== null).length
  const requiredFields = animalFields.filter((f) => f.required)
  const mappedRequired = requiredFields.filter((f) =>
    Object.values(autoMapping).includes(f.key)
  )

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {analyzing ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              Analyzing file...
            </>
          ) : (
            <>
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              Analysis Complete
            </>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {analyzing ? (
          <div className="py-8 text-center text-muted-foreground">
            <p>Detecting column types and matching fields...</p>
          </div>
        ) : (
          <>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="p-4 bg-muted rounded-lg text-center">
                <div className="text-2xl font-bold">{data.totalRows}</div>
                <div className="text-sm text-muted-foreground">Total Rows</div>
              </div>
              <div className="p-4 bg-muted rounded-lg text-center">
                <div className="text-2xl font-bold">{data.headers.length}</div>
                <div className="text-sm text-muted-foreground">Columns</div>
              </div>
              <div className="p-4 bg-muted rounded-lg text-center">
                <div className="text-2xl font-bold">{mappedCount}</div>
                <div className="text-sm text-muted-foreground">Auto-Mapped</div>
              </div>
            </div>

            <div>
              <h3 className="font-medium mb-2">Detected Columns</h3>
              <div className="border rounded-lg divide-y max-h-64 overflow-auto">
                {data.headers.map((header) => (
                  <div key={header} className="flex items-center justify-between p-3">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm">{header}</span>
                      <Badge variant="secondary" className="text-xs">
                        {detectedTypes[header]}
                      </Badge>
                    </div>
                    {autoMapping[header] ? (
                      <Badge variant="success" className="text-xs">
                        → {animalFields.find((f) => f.key === autoMapping[header])?.label}
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-xs">
                        Skip
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <div>
                <span className="font-medium">Required fields:</span>{" "}
                <span className="text-muted-foreground">
                  {mappedRequired.length}/{requiredFields.length} mapped
                </span>
              </div>
              {mappedRequired.length === requiredFields.length ? (
                <Badge variant="success">All required fields mapped</Badge>
              ) : (
                <Badge variant="warning">
                  Missing: {requiredFields.filter((f) => !Object.values(autoMapping).includes(f.key)).map((f) => f.label).join(", ")}
                </Badge>
              )}
            </div>

            <div className="flex justify-between">
              <Button variant="outline" onClick={onBack}>
                Back
              </Button>
              <Button onClick={() => onComplete(autoMapping)}>
                Continue to Field Mapping
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}

function detectDataType(samples: string[]): string {
  const nonEmpty = samples.filter((s) => s && s.trim())
  if (nonEmpty.length === 0) return "text"

  // Check if all are dates
  const datePatterns = [
    /^\d{4}-\d{2}-\d{2}$/,
    /^\d{2}\/\d{2}\/\d{4}$/,
    /^\d{2}\.\d{2}\.\d{4}$/,
  ]
  if (nonEmpty.every((s) => datePatterns.some((p) => p.test(s)))) {
    return "date"
  }

  // Check if all are numbers
  if (nonEmpty.every((s) => !isNaN(Number(s.replace(",", "."))))) {
    return "number"
  }

  return "text"
}
