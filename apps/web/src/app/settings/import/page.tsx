import Link from "next/link"
import { ArrowLeft, FileSpreadsheet, Users, Calendar, Milk } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

const importTypes = [
  {
    title: "Animals",
    description: "Import animal records with identification, breed, and status",
    icon: Users,
    href: "/settings/import/animals",
    templateDownload: "/templates/animals_template.xlsx",
  },
  {
    title: "Events",
    description: "Import breeding, calving, treatments, and other events",
    icon: Calendar,
    href: "/settings/import/events",
    templateDownload: "/templates/events_template.xlsx",
  },
  {
    title: "Lactations",
    description: "Import historical lactation records with production data",
    icon: Milk,
    href: "/settings/import/lactations",
    templateDownload: "/templates/lactations_template.xlsx",
  },
]

export default function ImportPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/settings">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Import Data</h1>
          <p className="text-muted-foreground">
            Import data from Excel, CSV, or other herd management systems
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {importTypes.map((type) => (
          <Card key={type.href} className="relative">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-primary/10 p-2">
                  <type.icon className="h-5 w-5 text-primary" />
                </div>
                <CardTitle className="text-lg">{type.title}</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <CardDescription>{type.description}</CardDescription>
              <div className="flex gap-2">
                <Link href={type.href} className="flex-1">
                  <Button className="w-full">Import</Button>
                </Link>
                <Button variant="outline" size="icon" title="Download template">
                  <FileSpreadsheet className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Supported Formats</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p><strong>Excel:</strong> .xlsx, .xls files with headers in the first row</p>
          <p><strong>CSV:</strong> Comma, semicolon, or tab-separated values</p>
          <p><strong>DairyComp 305:</strong> Standard export format (auto-detected)</p>
        </CardContent>
      </Card>
    </div>
  )
}
