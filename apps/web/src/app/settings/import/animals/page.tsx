"use client"

import { useState } from "react"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ImportWizard } from "@/components/import/import-wizard"

export default function ImportAnimalsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/settings/import">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Import Animals</h1>
          <p className="text-muted-foreground">
            Upload your animal data from Excel or CSV
          </p>
        </div>
      </div>

      <ImportWizard targetEntity="animals" />
    </div>
  )
}
