import { getBullsWithInventory, getInventoryStats } from '@/lib/data/bulls'
import { BullsManagementClient } from '@/components/settings/bulls-management-client'

export default async function BullsPage() {
  const [bulls, stats] = await Promise.all([getBullsWithInventory(false), getInventoryStats()])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Bulls Management</h1>
        <p className="text-muted-foreground">Manage bull catalog and semen inventory</p>
      </div>

      <BullsManagementClient bulls={bulls} stats={stats} />
    </div>
  )
}
