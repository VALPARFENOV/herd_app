"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import {
  Baby,
  Syringe,
  Heart,
  Droplets,
  AlertTriangle,
  Activity,
} from "lucide-react"
import type { SidebarData } from "@/lib/data/sidebar"

const iconMap = {
  "Fresh Cows": Baby,
  "To Breed": Heart,
  "Pregnancy Check": Activity,
  "Dry Off": Droplets,
  "Vet List": Syringe,
  "Alerts": AlertTriangle,
}

interface SidebarProps {
  data: SidebarData
}

export function Sidebar({ data }: SidebarProps) {
  const pathname = usePathname()

  return (
    <aside className="hidden lg:flex w-64 flex-col fixed left-0 top-14 h-[calc(100vh-3.5rem)] border-r bg-background">
      <div className="flex-1 overflow-auto py-4">
        <div className="px-3 py-2">
          <h2 className="mb-2 px-4 text-lg font-semibold tracking-tight">
            Quick Access
          </h2>
          <div className="space-y-1">
            {data.quickAccess.map((item) => {
              const Icon = iconMap[item.name as keyof typeof iconMap] || Activity
              return (
                <Link key={item.name} href={item.href}>
                  <Button
                    variant={pathname === item.href ? "secondary" : "ghost"}
                    className="w-full justify-start"
                  >
                    <Icon className="mr-2 h-4 w-4" />
                    <span className="flex-1 text-left">{item.name}</span>
                    {item.count > 0 && (
                      <span className="ml-auto bg-muted text-muted-foreground rounded-full px-2 py-0.5 text-xs">
                        {item.count}
                      </span>
                    )}
                  </Button>
                </Link>
              )
            })}
          </div>
        </div>
        <Separator className="my-4" />
        <div className="px-3 py-2">
          <h2 className="mb-2 px-4 text-lg font-semibold tracking-tight">
            Herd Overview
          </h2>
          <div className="space-y-3 px-4">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Total Animals</span>
              <span className="font-medium">{data.herdOverview.total}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Milking</span>
              <span className="font-medium">{data.herdOverview.milking}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Dry</span>
              <span className="font-medium">{data.herdOverview.dry}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Heifers</span>
              <span className="font-medium">{data.herdOverview.heifers}</span>
            </div>
          </div>
        </div>
      </div>
    </aside>
  )
}
