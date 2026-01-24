"use client"

import { useEffect, useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { getSemenInventory, type SemenInventory } from "@/lib/data/bulls"
import { Loader2 } from "lucide-react"

interface InventoryDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  bullId: string
  bullName: string
}

export function InventoryDialog({ open, onOpenChange, bullId, bullName }: InventoryDialogProps) {
  const [inventory, setInventory] = useState<SemenInventory[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (open && bullId) {
      setLoading(true)
      getSemenInventory(bullId).then((data) => {
        setInventory(data)
        setLoading(false)
      })
    }
  }, [open, bullId])

  const totalReceived = inventory.reduce((sum, inv) => sum + inv.straws_received, 0)
  const totalUsed = inventory.reduce((sum, inv) => sum + inv.straws_used, 0)
  const totalAvailable = inventory.reduce((sum, inv) => sum + inv.straws_available, 0)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px]">
        <DialogHeader>
          <DialogTitle>Semen Inventory - {bullName}</DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center p-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-4">
            {/* Summary */}
            <div className="grid grid-cols-3 gap-4 p-4 bg-muted rounded-lg">
              <div>
                <div className="text-sm text-muted-foreground">Total Received</div>
                <div className="text-2xl font-bold">{totalReceived}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Total Used</div>
                <div className="text-2xl font-bold">{totalUsed}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Available</div>
                <div className="text-2xl font-bold text-green-600">{totalAvailable}</div>
              </div>
            </div>

            {/* Batches Table */}
            {inventory.length === 0 ? (
              <div className="text-center text-muted-foreground p-8 border rounded-lg">
                No inventory batches found
              </div>
            ) : (
              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Batch</TableHead>
                      <TableHead>Received</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Straws</TableHead>
                      <TableHead>Expiry</TableHead>
                      <TableHead className="text-right">Cost</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {inventory.map((batch) => {
                      const isExpired =
                        batch.expiry_date && new Date(batch.expiry_date) < new Date()
                      const isLowStock = batch.straws_available < 5 && batch.straws_available > 0

                      return (
                        <TableRow key={batch.id}>
                          <TableCell className="font-medium">
                            {batch.batch_number || '—'}
                          </TableCell>
                          <TableCell>
                            {new Date(batch.received_date).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              {batch.tank_number && batch.canister_number
                                ? `${batch.tank_number} / ${batch.canister_number}`
                                : '—'}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Badge
                                variant={
                                  batch.straws_available === 0
                                    ? 'secondary'
                                    : isLowStock
                                    ? 'warning'
                                    : 'success'
                                }
                              >
                                {batch.straws_available}/{batch.straws_received}
                              </Badge>
                            </div>
                          </TableCell>
                          <TableCell>
                            {batch.expiry_date ? (
                              <Badge variant={isExpired ? 'destructive' : 'secondary'}>
                                {new Date(batch.expiry_date).toLocaleDateString()}
                              </Badge>
                            ) : (
                              '—'
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            {batch.total_cost !== null
                              ? `$${batch.total_cost.toFixed(2)}`
                              : '—'}
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
