"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { AlertTriangle, CheckCircle2 } from "lucide-react"
import type { ParsedData, FieldMapping, ValidationResult } from "../import-wizard"

interface PreviewStepProps {
  data: ParsedData
  mapping: FieldMapping
  validation: ValidationResult
  targetEntity: string
  onConfirm: () => void
  onBack: () => void
}

const fieldLabels: Record<string, string> = {
  ear_tag: "Ear Tag",
  name: "Name",
  birth_date: "Birth Date",
  breed: "Breed",
  sex: "Sex",
  current_status: "Status",
  lactation_number: "Lact #",
  pen_name: "Pen",
}

export function PreviewStep({
  data,
  mapping,
  validation,
  targetEntity,
  onConfirm,
  onBack,
}: PreviewStepProps) {
  // Get list of target fields that are mapped
  const mappedFields = Object.entries(mapping)
    .filter(([_, target]) => target !== null)
    .map(([source, target]) => ({ source, target: target as string }))

  // Get error row numbers for highlighting
  const errorRowNums = new Set(
    validation.errors.filter((e) => !e.isWarning).map((e) => e.row)
  )

  // Preview first 20 valid rows
  const previewRows = data.rows
    .map((row, idx) => ({ row, rowNum: idx + 1 }))
    .filter(({ rowNum }) => !errorRowNums.has(rowNum))
    .slice(0, 20)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Preview Import</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="p-4 bg-muted rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Import Summary</p>
              <p className="text-sm text-muted-foreground mt-1">
                {validation.validRows} animals will be imported
                {validation.errorRows > 0 && `, ${validation.errorRows} rows will be skipped due to errors`}
              </p>
            </div>
            {validation.errorRows === 0 ? (
              <Badge variant="success" className="flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3" />
                Ready
              </Badge>
            ) : (
              <Badge variant="warning" className="flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" />
                Partial
              </Badge>
            )}
          </div>
        </div>

        <div>
          <h3 className="font-medium mb-2">Data Preview (first 20 rows)</h3>
          <div className="border rounded-lg overflow-auto max-h-96">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[60px]">#</TableHead>
                  {mappedFields.slice(0, 8).map(({ target }) => (
                    <TableHead key={target}>
                      {fieldLabels[target] || target}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {previewRows.map(({ row, rowNum }) => (
                  <TableRow key={rowNum}>
                    <TableCell className="text-muted-foreground">{rowNum}</TableCell>
                    {mappedFields.slice(0, 8).map(({ source, target }) => (
                      <TableCell key={target} className="font-mono text-sm">
                        {formatValue(row[source], target)}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          {validation.validRows > 20 && (
            <p className="text-sm text-muted-foreground mt-2">
              ... and {validation.validRows - 20} more rows
            </p>
          )}
        </div>

        <div className="border-t pt-4">
          <h3 className="font-medium mb-2">Field Mapping Summary</h3>
          <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
            {mappedFields.map(({ source, target }) => (
              <div key={source} className="flex items-center gap-2 text-sm">
                <span className="font-mono text-muted-foreground">{source}</span>
                <span>→</span>
                <span className="font-medium">{fieldLabels[target] || target}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-between">
          <Button variant="outline" onClick={onBack}>
            Back
          </Button>
          <Button onClick={onConfirm}>
            Start Import
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

function formatValue(value: string | undefined, field: string): string {
  if (!value) return "—"

  // Format dates
  if (["birth_date", "last_calving_date"].includes(field)) {
    try {
      // Try to parse and format consistently
      const date = new Date(value.replace(/(\d{2})\.(\d{2})\.(\d{4})/, "$3-$2-$1"))
      if (!isNaN(date.getTime())) {
        return date.toLocaleDateString()
      }
    } catch {
      return value
    }
  }

  return value
}
