"use client"

import Link from "next/link"
import { ExternalLink } from "lucide-react"
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
import type { BreedingListAnimal } from "@/lib/data/breeding-lists"

interface BreedingTableProps {
  animals: BreedingListAnimal[]
  type: 'to_breed' | 'preg_check' | 'dry_off' | 'fresh'
  onAction?: (animalId: string) => void
}

export function BreedingTable({ animals, type, onAction }: BreedingTableProps) {
  if (animals.length === 0) {
    return (
      <div className="border rounded-lg p-8 text-center text-muted-foreground">
        No animals in this list
      </div>
    )
  }

  const getActionButton = (animal: BreedingListAnimal) => {
    switch (type) {
      case 'to_breed':
        return (
          <Button
            size="sm"
            onClick={() => onAction?.(animal.id)}
            className="mr-2"
          >
            Breed
          </Button>
        )
      case 'preg_check':
        return (
          <Button
            size="sm"
            onClick={() => onAction?.(animal.id)}
            className="mr-2"
          >
            Preg Check
          </Button>
        )
      case 'dry_off':
        return (
          <Button
            size="sm"
            onClick={() => onAction?.(animal.id)}
            className="mr-2"
          >
            Dry Off
          </Button>
        )
      default:
        return null
    }
  }

  return (
    <div className="border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>ID</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Pen</TableHead>
            <TableHead>Lact</TableHead>
            <TableHead>DIM</TableHead>
            {type === 'to_breed' && (
              <>
                <TableHead>Last Heat</TableHead>
                <TableHead>Times Bred</TableHead>
              </>
            )}
            {type === 'preg_check' && (
              <>
                <TableHead>Last Bred</TableHead>
                <TableHead>Days Since</TableHead>
                <TableHead>Times Bred</TableHead>
              </>
            )}
            {type === 'dry_off' && (
              <>
                <TableHead>Expected Calving</TableHead>
                <TableHead>Days to Calving</TableHead>
                <TableHead>Days Carried</TableHead>
              </>
            )}
            {type === 'fresh' && (
              <>
                <TableHead>Calving Date</TableHead>
                <TableHead>RC</TableHead>
              </>
            )}
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {animals.map((animal) => (
            <TableRow key={animal.id}>
              <TableCell className="font-medium">{animal.ear_tag}</TableCell>
              <TableCell>{animal.name || '—'}</TableCell>
              <TableCell>{animal.pen_name || '—'}</TableCell>
              <TableCell>{animal.lactation_number}</TableCell>
              <TableCell>
                {animal.dim !== null ? (
                  <Badge variant={animal.dim <= 21 ? 'success' : 'secondary'}>
                    {animal.dim}
                  </Badge>
                ) : (
                  '—'
                )}
              </TableCell>

              {type === 'to_breed' && (
                <>
                  <TableCell>
                    {animal.last_heat_date
                      ? new Date(animal.last_heat_date).toLocaleDateString()
                      : '—'}
                  </TableCell>
                  <TableCell>{animal.times_bred}</TableCell>
                </>
              )}

              {type === 'preg_check' && (
                <>
                  <TableCell>
                    {animal.last_breeding_date
                      ? new Date(animal.last_breeding_date).toLocaleDateString()
                      : '—'}
                  </TableCell>
                  <TableCell>
                    {animal.days_since_last_breeding !== null && (
                      <Badge
                        variant={
                          animal.days_since_last_breeding > 45
                            ? 'destructive'
                            : animal.days_since_last_breeding > 40
                            ? 'warning'
                            : 'secondary'
                        }
                      >
                        {animal.days_since_last_breeding}d
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>{animal.times_bred}</TableCell>
                </>
              )}

              {type === 'dry_off' && (
                <>
                  <TableCell>
                    {animal.expected_calving_date
                      ? new Date(animal.expected_calving_date).toLocaleDateString()
                      : '—'}
                  </TableCell>
                  <TableCell>
                    {animal.days_to_calving !== null && (
                      <Badge
                        variant={
                          animal.days_to_calving <= 30
                            ? 'destructive'
                            : animal.days_to_calving <= 45
                            ? 'warning'
                            : 'secondary'
                        }
                      >
                        {animal.days_to_calving}d
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {animal.days_carried !== null ? `${animal.days_carried}d` : '—'}
                  </TableCell>
                </>
              )}

              {type === 'fresh' && (
                <>
                  <TableCell>
                    {animal.last_calving_date
                      ? new Date(animal.last_calving_date).toLocaleDateString()
                      : '—'}
                  </TableCell>
                  <TableCell>
                    <Badge variant="success">{animal.rc}</Badge>
                  </TableCell>
                </>
              )}

              <TableCell className="text-right">
                <div className="flex justify-end items-center">
                  {getActionButton(animal)}
                  <Link href={`/animals/${animal.id}`}>
                    <Button variant="ghost" size="icon">
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
