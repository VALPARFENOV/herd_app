import Link from "next/link"
import {
  Upload,
  Download,
  Users,
  Building2,
  Bell,
  Shield,
  Database,
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

const settingsGroups = [
  {
    title: "Data Management",
    items: [
      {
        title: "Import Data",
        description: "Import animals, events, or lactations from Excel/CSV",
        icon: Upload,
        href: "/settings/import",
        highlight: true,
      },
      {
        title: "Export Data",
        description: "Export your data to Excel, CSV, or PDF",
        icon: Download,
        href: "/settings/export",
      },
      {
        title: "Backup & Restore",
        description: "Manage database backups",
        icon: Database,
        href: "/settings/backup",
      },
    ],
  },
  {
    title: "Farm Setup",
    items: [
      {
        title: "Barns & Pens",
        description: "Configure your farm structure",
        icon: Building2,
        href: "/settings/farm",
      },
      {
        title: "Team Members",
        description: "Manage users and permissions",
        icon: Users,
        href: "/settings/users",
      },
    ],
  },
  {
    title: "System",
    items: [
      {
        title: "Notifications",
        description: "Configure alerts and reminders",
        icon: Bell,
        href: "/settings/notifications",
      },
      {
        title: "Security",
        description: "Password and security settings",
        icon: Shield,
        href: "/settings/security",
      },
    ],
  },
]

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">Manage your farm and application settings</p>
      </div>

      {settingsGroups.map((group) => (
        <div key={group.title} className="space-y-4">
          <h2 className="text-lg font-semibold">{group.title}</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {group.items.map((item) => (
              <Link key={item.href} href={item.href}>
                <Card className={`h-full transition-colors hover:bg-muted/50 ${item.highlight ? "border-primary" : ""}`}>
                  <CardHeader className="flex flex-row items-center gap-4 pb-2">
                    <div className={`rounded-lg p-2 ${item.highlight ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
                      <item.icon className="h-5 w-5" />
                    </div>
                    <div>
                      <CardTitle className="text-base">{item.title}</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <CardDescription>{item.description}</CardDescription>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
