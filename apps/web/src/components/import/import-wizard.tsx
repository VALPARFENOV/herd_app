"use client"

import { useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Check, Upload, FileSearch, Settings2, AlertTriangle, Eye, Import } from "lucide-react"
import { cn } from "@/lib/utils"
import { FileUploadStep } from "./steps/file-upload-step"
import { AnalyzeStep } from "./steps/analyze-step"
import { MappingStep } from "./steps/mapping-step"
import { ValidationStep } from "./steps/validation-step"
import { PreviewStep } from "./steps/preview-step"
import { ImportStep } from "./steps/import-step"

interface ImportWizardProps {
  targetEntity: "animals" | "events" | "lactations"
}

export interface ParsedData {
  headers: string[]
  rows: Record<string, string>[]
  fileName: string
  totalRows: number
}

export interface FieldMapping {
  [sourceColumn: string]: string | null // maps to target field or null (skip)
}

export interface ValidationResult {
  validRows: number
  warningRows: number
  errorRows: number
  errors: {
    row: number
    column: string
    value: string
    type: string
    message: string
    isWarning: boolean
  }[]
}

const steps = [
  { id: "upload", label: "Upload", icon: Upload },
  { id: "analyze", label: "Analyze", icon: FileSearch },
  { id: "map", label: "Map Fields", icon: Settings2 },
  { id: "validate", label: "Validate", icon: AlertTriangle },
  { id: "preview", label: "Preview", icon: Eye },
  { id: "import", label: "Import", icon: Import },
]

export function ImportWizard({ targetEntity }: ImportWizardProps) {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(0)
  const [parsedData, setParsedData] = useState<ParsedData | null>(null)
  const [mapping, setMapping] = useState<FieldMapping>({})
  const [validation, setValidation] = useState<ValidationResult | null>(null)
  const [importComplete, setImportComplete] = useState(false)
  const [importedCount, setImportedCount] = useState(0)

  const handleFileUploaded = useCallback((data: ParsedData) => {
    setParsedData(data)
    setCurrentStep(1)
  }, [])

  const handleAnalysisComplete = useCallback((autoMapping: FieldMapping) => {
    setMapping(autoMapping)
    setCurrentStep(2)
  }, [])

  const handleMappingComplete = useCallback((newMapping: FieldMapping) => {
    setMapping(newMapping)
    setCurrentStep(3)
  }, [])

  const handleValidationComplete = useCallback((result: ValidationResult) => {
    setValidation(result)
    setCurrentStep(4)
  }, [])

  const handlePreviewConfirmed = useCallback(() => {
    setCurrentStep(5)
  }, [])

  const handleImportComplete = useCallback((count: number) => {
    setImportedCount(count)
    setImportComplete(true)
  }, [])

  const goBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const progress = ((currentStep + 1) / steps.length) * 100

  return (
    <div className="space-y-6">
      {/* Progress indicator */}
      <Card>
        <CardContent className="py-4">
          <div className="flex items-center justify-between mb-2">
            {steps.map((step, index) => (
              <div
                key={step.id}
                className={cn(
                  "flex items-center gap-2",
                  index <= currentStep ? "text-primary" : "text-muted-foreground"
                )}
              >
                <div
                  className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-full border-2 text-sm font-medium",
                    index < currentStep && "bg-primary border-primary text-primary-foreground",
                    index === currentStep && "border-primary text-primary",
                    index > currentStep && "border-muted-foreground"
                  )}
                >
                  {index < currentStep ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <step.icon className="h-4 w-4" />
                  )}
                </div>
                <span className="hidden md:inline text-sm font-medium">{step.label}</span>
              </div>
            ))}
          </div>
          <Progress value={progress} className="h-2" />
        </CardContent>
      </Card>

      {/* Step content */}
      {currentStep === 0 && (
        <FileUploadStep onFileUploaded={handleFileUploaded} />
      )}

      {currentStep === 1 && parsedData && (
        <AnalyzeStep
          data={parsedData}
          targetEntity={targetEntity}
          onComplete={handleAnalysisComplete}
          onBack={goBack}
        />
      )}

      {currentStep === 2 && parsedData && (
        <MappingStep
          data={parsedData}
          targetEntity={targetEntity}
          initialMapping={mapping}
          onComplete={handleMappingComplete}
          onBack={goBack}
        />
      )}

      {currentStep === 3 && parsedData && (
        <ValidationStep
          data={parsedData}
          mapping={mapping}
          targetEntity={targetEntity}
          onComplete={handleValidationComplete}
          onBack={goBack}
        />
      )}

      {currentStep === 4 && parsedData && validation && (
        <PreviewStep
          data={parsedData}
          mapping={mapping}
          validation={validation}
          targetEntity={targetEntity}
          onConfirm={handlePreviewConfirmed}
          onBack={goBack}
        />
      )}

      {currentStep === 5 && parsedData && validation && (
        <ImportStep
          data={parsedData}
          mapping={mapping}
          validation={validation}
          targetEntity={targetEntity}
          onComplete={handleImportComplete}
          importComplete={importComplete}
          importedCount={importedCount}
          onBack={goBack}
        />
      )}
    </div>
  )
}
