"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { ArrowRight } from "lucide-react"
import type { ParsedData, FieldMapping } from "../import-wizard"

interface MappingStepProps {
  data: ParsedData
  targetEntity: string
  initialMapping: FieldMapping
  onComplete: (mapping: FieldMapping) => void
  onBack: () => void
}

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
  { key: "electronic_id", label: "Electronic ID (RFID)", required: false },
  { key: "sire_registration", label: "Sire Registration", required: false },
  { key: "dam_registration", label: "Dam Registration", required: false },
  { key: "last_calving_date", label: "Last Calving Date", required: false },
  { key: "notes", label: "Notes", required: false },
]

export function MappingStep({
  data,
  targetEntity,
  initialMapping,
  onComplete,
  onBack,
}: MappingStepProps) {
  const [mapping, setMapping] = useState<FieldMapping>(initialMapping)

  const updateMapping = (sourceColumn: string, targetField: string | null) => {
    setMapping((prev) => ({
      ...prev,
      [sourceColumn]: targetField,
    }))
  }

  const requiredFields = animalFields.filter((f) => f.required)
  const mappedRequired = requiredFields.filter((f) =>
    Object.values(mapping).includes(f.key)
  )
  const isValid = mappedRequired.length === requiredFields.length

  // Sample data for preview
  const sampleRows = data.rows.slice(0, 3)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Map Fields</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <p className="text-sm text-muted-foreground">
          Match your file columns to the corresponding fields in the system.
          Required fields are marked with *.
        </p>

        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[200px]">Source Column</TableHead>
                <TableHead className="w-[50px]" />
                <TableHead className="w-[200px]">Target Field</TableHead>
                <TableHead>Sample Data</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.headers.map((header) => (
                <TableRow key={header}>
                  <TableCell className="font-mono text-sm">{header}</TableCell>
                  <TableCell>
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  </TableCell>
                  <TableCell>
                    <Select
                      value={mapping[header] || "skip"}
                      onValueChange={(value) =>
                        updateMapping(header, value === "skip" ? null : value)
                      }
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select field..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="skip">
                          <span className="text-muted-foreground">— Skip —</span>
                        </SelectItem>
                        {animalFields.map((field) => (
                          <SelectItem key={field.key} value={field.key}>
                            {field.label}
                            {field.required && " *"}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground font-mono">
                    {sampleRows.map((row, i) => row[header]).filter(Boolean).slice(0, 3).join(", ") || "—"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
          <div className="space-y-1">
            <div className="text-sm">
              <span className="font-medium">Mapped:</span>{" "}
              {Object.values(mapping).filter((v) => v !== null).length} of{" "}
              {data.headers.length} columns
            </div>
            <div className="text-sm">
              <span className="font-medium">Required:</span>{" "}
              {mappedRequired.length} of {requiredFields.length}
            </div>
          </div>
          {isValid ? (
            <Badge variant="success">Ready to validate</Badge>
          ) : (
            <Badge variant="warning">
              Missing required:{" "}
              {requiredFields
                .filter((f) => !Object.values(mapping).includes(f.key))
                .map((f) => f.label)
                .join(", ")}
            </Badge>
          )}
        </div>

        <div className="flex justify-between">
          <Button variant="outline" onClick={onBack}>
            Back
          </Button>
          <Button onClick={() => onComplete(mapping)} disabled={!isValid}>
            Validate Data
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
