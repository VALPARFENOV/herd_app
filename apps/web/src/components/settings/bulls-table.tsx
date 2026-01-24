"use client"

import { useState } from "react"
import { Edit, Package, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import type { BullWithInventory } from "@/lib/data/bulls"

interface BullsTableProps {
  bulls: BullWithInventory[]
  onEdit?: (bull: BullWithInventory) => void
  onViewInventory?: (bull: BullWithInventory) => void
}

export function BullsTable({ bulls, onEdit, onViewInventory }: BullsTableProps) {
  if (bulls.length === 0) {
    return (
      <div className="border rounded-lg p-8 text-center text-muted-foreground">
        No bulls in catalog
      </div>
    )
  }

  return (
    <div className="border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Breed</TableHead>
            <TableHead>NAAB Code</TableHead>
            <TableHead>NM$</TableHead>
            <TableHead>Straws</TableHead>
            <TableHead>Cost/Straw</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {bulls.map((bull) => (
            <TableRow key={bull.id}>
              <TableCell>
                <div>
                  <div className="font-medium">{bull.short_name || bull.name}</div>
                  {bull.short_name && bull.short_name !== bull.name && (
                    <div className="text-xs text-muted-foreground">{bull.name}</div>
                  )}
                </div>
              </TableCell>
              <TableCell>{bull.breed}</TableCell>
              <TableCell>
                <span className="font-mono text-sm">{bull.naab_code || '—'}</span>
              </TableCell>
              <TableCell>
                {bull.net_merit_dollars !== null ? (
                  <Badge variant={bull.net_merit_dollars >= 900 ? 'success' : 'secondary'}>
                    ${bull.net_merit_dollars}
                  </Badge>
                ) : (
                  '—'
                )}
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <span className="font-medium">{bull.available_straws}</span>
                  {bull.available_straws < 10 && bull.available_straws > 0 && (
                    <AlertCircle className="h-4 w-4 text-yellow-600" />
                  )}
                  {bull.available_straws === 0 && (
                    <AlertCircle className="h-4 w-4 text-destructive" />
                  )}
                  <span className="text-xs text-muted-foreground">
                    ({bull.batches_count} {bull.batches_count === 1 ? 'batch' : 'batches'})
                  </span>
                </div>
              </TableCell>
              <TableCell>
                {bull.semen_cost_per_straw !== null ? `$${bull.semen_cost_per_straw.toFixed(2)}` : '—'}
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <Badge variant={bull.is_active ? 'success' : 'secondary'}>
                    {bull.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                  {bull.is_sexed && (
                    <Badge variant="info" className="text-xs">
                      Sexed
                    </Badge>
                  )}
                </div>
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onViewInventory?.(bull)}
                    title="View inventory"
                  >
                    <Package className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => onEdit?.(bull)} title="Edit bull">
                    <Edit className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
