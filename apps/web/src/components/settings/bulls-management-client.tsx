"use client"

import { useState } from "react"
import { Plus, Package, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { BullsTable } from "./bulls-table"
import { InventoryDialog } from "./inventory-dialog"
import type { BullWithInventory } from "@/lib/data/bulls"

interface BullsManagementClientProps {
  bulls: BullWithInventory[]
  stats: {
    total_bulls: number
    active_bulls: number
    total_straws: number
    low_inventory_count: number
  }
}

export function BullsManagementClient({ bulls, stats }: BullsManagementClientProps) {
  const [activeTab, setActiveTab] = useState('all')
  const [selectedBull, setSelectedBull] = useState<BullWithInventory | null>(null)
  const [inventoryDialogOpen, setInventoryDialogOpen] = useState(false)

  const activeBulls = bulls.filter((b) => b.is_active)
  const inactiveBulls = bulls.filter((b) => !b.is_active)
  const lowInventoryBulls = bulls.filter((b) => b.is_active && b.available_straws < 10 && b.available_straws > 0)

  const handleViewInventory = (bull: BullWithInventory) => {
    setSelectedBull(bull)
    setInventoryDialogOpen(true)
  }

  return (
    <>
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Bulls</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total_bulls}</div>
            <p className="text-xs text-muted-foreground">{stats.active_bulls} active</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Straws</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total_straws}</div>
            <p className="text-xs text-muted-foreground">Available in inventory</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Low Inventory</CardTitle>
            <AlertCircle className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.low_inventory_count}</div>
            <p className="text-xs text-muted-foreground">Bulls with &lt;10 straws</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Breeds</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Set(bulls.map((b) => b.breed)).size}
            </div>
            <p className="text-xs text-muted-foreground">Different breeds</p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="all">All Bulls ({bulls.length})</TabsTrigger>
            <TabsTrigger value="active">Active ({activeBulls.length})</TabsTrigger>
            <TabsTrigger value="low_inventory">
              Low Inventory ({lowInventoryBulls.length})
            </TabsTrigger>
            <TabsTrigger value="inactive">Inactive ({inactiveBulls.length})</TabsTrigger>
          </TabsList>

          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Bull
          </Button>
        </div>

        <TabsContent value="all" className="mt-6">
          <BullsTable bulls={bulls} onViewInventory={handleViewInventory} />
        </TabsContent>

        <TabsContent value="active" className="mt-6">
          <BullsTable bulls={activeBulls} onViewInventory={handleViewInventory} />
        </TabsContent>

        <TabsContent value="low_inventory" className="mt-6">
          <div className="space-y-4">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-yellow-600" />
                <p className="text-sm font-medium text-yellow-900">
                  These bulls have less than 10 straws available. Consider reordering.
                </p>
              </div>
            </div>
            <BullsTable bulls={lowInventoryBulls} onViewInventory={handleViewInventory} />
          </div>
        </TabsContent>

        <TabsContent value="inactive" className="mt-6">
          <BullsTable bulls={inactiveBulls} onViewInventory={handleViewInventory} />
        </TabsContent>
      </Tabs>

      {selectedBull && (
        <InventoryDialog
          open={inventoryDialogOpen}
          onOpenChange={setInventoryDialogOpen}
          bullId={selectedBull.id}
          bullName={selectedBull.short_name || selectedBull.name}
        />
      )}
    </>
  )
}
