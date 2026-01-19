"use client"

import { useState, useCallback } from "react"
import { Upload, FileSpreadsheet, X, Loader2 } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { ParsedData } from "../import-wizard"

interface FileUploadStepProps {
  onFileUploaded: (data: ParsedData) => void
}

export function FileUploadStep({ onFileUploaded }: FileUploadStepProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const processFile = async (file: File) => {
    setLoading(true)
    setError(null)

    try {
      // Dynamically import SheetJS
      const XLSX = await import("xlsx")

      const data = await file.arrayBuffer()
      const workbook = XLSX.read(data)
      const sheetName = workbook.SheetNames[0]
      const worksheet = workbook.Sheets[sheetName]

      // Convert to JSON with headers
      const jsonData = XLSX.utils.sheet_to_json<Record<string, string>>(worksheet, {
        raw: false,
        defval: "",
      })

      if (jsonData.length === 0) {
        setError("The file appears to be empty or has no data rows")
        setLoading(false)
        return
      }

      // Get headers from first row
      const headers = Object.keys(jsonData[0])

      const parsedData: ParsedData = {
        headers,
        rows: jsonData,
        fileName: file.name,
        totalRows: jsonData.length,
      }

      onFileUploaded(parsedData)
    } catch (err) {
      console.error("Error parsing file:", err)
      setError("Failed to parse the file. Please ensure it's a valid Excel or CSV file.")
    } finally {
      setLoading(false)
    }
  }

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)

    const droppedFile = e.dataTransfer.files[0]
    if (droppedFile) {
      setFile(droppedFile)
      processFile(droppedFile)
    }
  }, [])

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      setFile(selectedFile)
      processFile(selectedFile)
    }
  }

  const clearFile = () => {
    setFile(null)
    setError(null)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Upload File</CardTitle>
      </CardHeader>
      <CardContent>
        {!file ? (
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={cn(
              "border-2 border-dashed rounded-lg p-12 text-center transition-colors",
              isDragging ? "border-primary bg-primary/5" : "border-muted-foreground/25",
              "hover:border-primary hover:bg-primary/5"
            )}
          >
            <Upload className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-lg font-medium mb-2">
              Drag and drop your file here
            </p>
            <p className="text-sm text-muted-foreground mb-4">
              or click to browse
            </p>
            <input
              type="file"
              id="file-upload"
              className="hidden"
              accept=".xlsx,.xls,.csv"
              onChange={handleFileSelect}
            />
            <label htmlFor="file-upload">
              <Button asChild>
                <span>Select File</span>
              </Button>
            </label>
            <p className="text-xs text-muted-foreground mt-4">
              Supported formats: Excel (.xlsx, .xls), CSV
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-4 p-4 border rounded-lg">
              <FileSpreadsheet className="h-10 w-10 text-primary" />
              <div className="flex-1">
                <p className="font-medium">{file.name}</p>
                <p className="text-sm text-muted-foreground">
                  {(file.size / 1024).toFixed(1)} KB
                </p>
              </div>
              {loading ? (
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              ) : (
                <Button variant="ghost" size="icon" onClick={clearFile}>
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>

            {loading && (
              <div className="text-center py-4">
                <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary mb-2" />
                <p className="text-sm text-muted-foreground">Processing file...</p>
              </div>
            )}

            {error && (
              <div className="p-4 bg-destructive/10 text-destructive rounded-lg text-sm">
                {error}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
