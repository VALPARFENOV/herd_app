"use client"

import { useEffect, useState } from "react"
import { Loader2, CheckCircle2, AlertTriangle, XCircle } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import type { ParsedData, FieldMapping, ValidationResult } from "../import-wizard"

interface ValidationStepProps {
  data: ParsedData
  mapping: FieldMapping
  targetEntity: string
  onComplete: (result: ValidationResult) => void
  onBack: () => void
}

interface ValidationError {
  row: number
  column: string
  value: string
  type: string
  message: string
  isWarning: boolean
}

export function ValidationStep({
  data,
  mapping,
  targetEntity,
  onComplete,
  onBack,
}: ValidationStepProps) {
  const [validating, setValidating] = useState(true)
  const [progress, setProgress] = useState(0)
  const [errors, setErrors] = useState<ValidationError[]>([])
  const [result, setResult] = useState<ValidationResult | null>(null)

  useEffect(() => {
    const validateData = async () => {
      const foundErrors: ValidationError[] = []
      const totalRows = data.rows.length
      const chunkSize = 100
      let processedRows = 0

      // Process in chunks to not block UI
      for (let i = 0; i < totalRows; i += chunkSize) {
        const chunk = data.rows.slice(i, i + chunkSize)

        chunk.forEach((row, idx) => {
          const rowNum = i + idx + 1

          // Validate each mapped field
          for (const [sourceCol, targetField] of Object.entries(mapping)) {
            if (!targetField) continue

            const value = row[sourceCol]

            // Check required fields
            if (["ear_tag", "birth_date", "breed"].includes(targetField)) {
              if (!value || value.trim() === "") {
                foundErrors.push({
                  row: rowNum,
                  column: sourceCol,
                  value: value || "",
                  type: "required_field",
                  message: `Required field "${targetField}" is empty`,
                  isWarning: false,
                })
              }
            }

            // Validate date format
            if (["birth_date", "last_calving_date"].includes(targetField) && value) {
              if (!isValidDate(value)) {
                foundErrors.push({
                  row: rowNum,
                  column: sourceCol,
                  value,
                  type: "invalid_date",
                  message: `Invalid date format: "${value}"`,
                  isWarning: false,
                })
              }
            }

            // Validate number format
            if (["lactation_number"].includes(targetField) && value) {
              if (isNaN(Number(value))) {
                foundErrors.push({
                  row: rowNum,
                  column: sourceCol,
                  value,
                  type: "invalid_number",
                  message: `Invalid number: "${value}"`,
                  isWarning: false,
                })
              }
            }

            // Validate sex values
            if (targetField === "sex" && value) {
              const normalizedValue = value.toLowerCase().trim()
              if (!["male", "female", "m", "f", "бык", "корова", "тёлка"].includes(normalizedValue)) {
                foundErrors.push({
                  row: rowNum,
                  column: sourceCol,
                  value,
                  type: "invalid_format",
                  message: `Unknown sex value: "${value}"`,
                  isWarning: true,
                })
              }
            }
          }
        })

        processedRows += chunk.length
        setProgress(Math.round((processedRows / totalRows) * 100))

        // Allow UI to update
        await new Promise((resolve) => setTimeout(resolve, 10))
      }

      // Calculate result
      const errorRows = new Set(foundErrors.filter((e) => !e.isWarning).map((e) => e.row))
      const warningRows = new Set(foundErrors.filter((e) => e.isWarning).map((e) => e.row))

      const validationResult: ValidationResult = {
        validRows: totalRows - errorRows.size,
        warningRows: warningRows.size,
        errorRows: errorRows.size,
        errors: foundErrors,
      }

      setErrors(foundErrors)
      setResult(validationResult)
      setValidating(false)
    }

    validateData()
  }, [data, mapping])

  const criticalErrors = errors.filter((e) => !e.isWarning)
  const warnings = errors.filter((e) => e.isWarning)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {validating ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              Validating Data...
            </>
          ) : result && result.errorRows === 0 ? (
            <>
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              Validation Complete
            </>
          ) : (
            <>
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
              Validation Issues Found
            </>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {validating ? (
          <div className="space-y-4">
            <Progress value={progress} />
            <p className="text-center text-sm text-muted-foreground">
              Checking {data.totalRows} rows...
            </p>
          </div>
        ) : result && (
          <>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-center">
                <CheckCircle2 className="h-6 w-6 text-green-500 mx-auto mb-1" />
                <div className="text-2xl font-bold text-green-700">{result.validRows}</div>
                <div className="text-sm text-green-600">Valid Rows</div>
              </div>
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-center">
                <AlertTriangle className="h-6 w-6 text-yellow-500 mx-auto mb-1" />
                <div className="text-2xl font-bold text-yellow-700">{result.warningRows}</div>
                <div className="text-sm text-yellow-600">Warnings</div>
              </div>
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-center">
                <XCircle className="h-6 w-6 text-red-500 mx-auto mb-1" />
                <div className="text-2xl font-bold text-red-700">{result.errorRows}</div>
                <div className="text-sm text-red-600">Errors</div>
              </div>
            </div>

            {errors.length > 0 && (
              <div className="space-y-4">
                <h3 className="font-medium">
                  Issues Found ({errors.length})
                  {errors.length > 50 && " — showing first 50"}
                </h3>
                <div className="border rounded-lg overflow-hidden max-h-64 overflow-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[80px]">Row</TableHead>
                        <TableHead className="w-[120px]">Column</TableHead>
                        <TableHead className="w-[120px]">Value</TableHead>
                        <TableHead>Issue</TableHead>
                        <TableHead className="w-[80px]">Type</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {errors.slice(0, 50).map((error, idx) => (
                        <TableRow key={idx}>
                          <TableCell>{error.row}</TableCell>
                          <TableCell className="font-mono text-sm">{error.column}</TableCell>
                          <TableCell className="font-mono text-sm truncate max-w-[120px]">
                            {error.value || "—"}
                          </TableCell>
                          <TableCell className="text-sm">{error.message}</TableCell>
                          <TableCell>
                            {error.isWarning ? (
                              <Badge variant="warning">Warning</Badge>
                            ) : (
                              <Badge variant="destructive">Error</Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}

            <div className="p-4 bg-muted rounded-lg">
              {result.errorRows > 0 ? (
                <p className="text-sm">
                  <strong>{result.validRows}</strong> rows can be imported.{" "}
                  <strong>{result.errorRows}</strong> rows have errors and will be skipped.
                </p>
              ) : result.warningRows > 0 ? (
                <p className="text-sm">
                  All <strong>{result.validRows}</strong> rows are valid. Some have warnings that
                  will be handled automatically.
                </p>
              ) : (
                <p className="text-sm text-green-600">
                  All <strong>{result.validRows}</strong> rows passed validation!
                </p>
              )}
            </div>

            <div className="flex justify-between">
              <Button variant="outline" onClick={onBack}>
                Back
              </Button>
              <Button onClick={() => onComplete(result)} disabled={result.validRows === 0}>
                Preview Import
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}

function isValidDate(value: string): boolean {
  // Try various date formats
  const patterns = [
    /^\d{4}-\d{2}-\d{2}$/, // YYYY-MM-DD
    /^\d{2}\/\d{2}\/\d{4}$/, // DD/MM/YYYY or MM/DD/YYYY
    /^\d{2}\.\d{2}\.\d{4}$/, // DD.MM.YYYY
  ]

  if (patterns.some((p) => p.test(value))) {
    const date = new Date(value.replace(/(\d{2})\.(\d{2})\.(\d{4})/, "$3-$2-$1"))
    return !isNaN(date.getTime())
  }

  return false
}
