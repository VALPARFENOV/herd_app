"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
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

const quickAccess = [
  {
    name: "Fresh Cows",
    href: "/animals?status=fresh",
    icon: Baby,
    count: 12
  },
  {
    name: "To Breed",
    href: "/tasks?type=breeding",
    icon: Heart,
    count: 8
  },
  {
    name: "Pregnancy Check",
    href: "/tasks?type=preg_check",
    icon: Activity,
    count: 5
  },
  {
    name: "Dry Off",
    href: "/tasks?type=dry_off",
    icon: Droplets,
    count: 3
  },
  {
    name: "Vet List",
    href: "/tasks?type=vet",
    icon: Syringe,
    count: 4
  },
  {
    name: "Alerts",
    href: "/alerts",
    icon: AlertTriangle,
    count: 7
  },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="hidden lg:flex w-64 flex-col fixed left-0 top-14 h-[calc(100vh-3.5rem)] border-r bg-background">
      <div className="flex-1 overflow-auto py-4">
        <div className="px-3 py-2">
          <h2 className="mb-2 px-4 text-lg font-semibold tracking-tight">
            Quick Access
          </h2>
          <div className="space-y-1">
            {quickAccess.map((item) => (
              <Link key={item.name} href={item.href}>
                <Button
                  variant={pathname === item.href ? "secondary" : "ghost"}
                  className="w-full justify-start"
                >
                  <item.icon className="mr-2 h-4 w-4" />
                  <span className="flex-1 text-left">{item.name}</span>
                  {item.count > 0 && (
                    <span className="ml-auto bg-muted text-muted-foreground rounded-full px-2 py-0.5 text-xs">
                      {item.count}
                    </span>
                  )}
                </Button>
              </Link>
            ))}
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
              <span className="font-medium">398</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Milking</span>
              <span className="font-medium">285</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Dry</span>
              <span className="font-medium">45</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Heifers</span>
              <span className="font-medium">68</span>
            </div>
          </div>
        </div>
      </div>
    </aside>
  )
}
