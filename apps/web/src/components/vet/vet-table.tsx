import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { AlertTriangle, Calendar, Syringe } from 'lucide-react'
import type { VetListAnimal } from '@/lib/data/vet-lists'

interface VetTableProps {
  animals: VetListAnimal[]
  type: 'fresh_check' | 'sick_pen' | 'scheduled' | 'active_treatments'
  onAction?: (animalId: string, actionType: 'exam' | 'treatment') => void
}

export function VetTable({ animals, type, onAction }: VetTableProps) {
  if (animals.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p>No animals in this list</p>
      </div>
    )
  }

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'lactating':
        return 'bg-blue-100 text-blue-800 hover:bg-blue-100'
      case 'fresh':
        return 'bg-green-100 text-green-800 hover:bg-green-100'
      case 'dry':
        return 'bg-gray-100 text-gray-800 hover:bg-gray-100'
      default:
        return ''
    }
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>ID</TableHead>
          <TableHead>Name</TableHead>
          <TableHead>Pen</TableHead>
          <TableHead>Lact</TableHead>
          <TableHead>DIM</TableHead>
          <TableHead>Status</TableHead>

          {type === 'fresh_check' && (
            <>
              <TableHead>Calving Date</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </>
          )}

          {type === 'sick_pen' && (
            <>
              <TableHead>Diagnosis</TableHead>
              <TableHead>Treatment Date</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </>
          )}

          {type === 'active_treatments' && (
            <>
              <TableHead>Diagnosis</TableHead>
              <TableHead>Withdrawal End</TableHead>
              <TableHead>Days Left</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </>
          )}

          {type === 'scheduled' && (
            <>
              <TableHead>Exam Type</TableHead>
              <TableHead>Scheduled Date</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </>
          )}
        </TableRow>
      </TableHeader>
      <TableBody>
        {animals.map((animal) => (
          <TableRow key={animal.id}>
            <TableCell className="font-mono">{animal.ear_tag}</TableCell>
            <TableCell>{animal.name || '-'}</TableCell>
            <TableCell>{animal.pen_name || '-'}</TableCell>
            <TableCell>{animal.current_lactation}</TableCell>
            <TableCell>{animal.dim || '-'}</TableCell>
            <TableCell>
              <Badge variant="outline" className={getStatusBadgeColor(animal.current_status)}>
                {animal.current_status}
              </Badge>
            </TableCell>

            {type === 'fresh_check' && (
              <>
                <TableCell>
                  {animal.last_calving_date
                    ? new Date(animal.last_calving_date).toLocaleDateString()
                    : '-'}
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onAction?.(animal.id, 'exam')}
                  >
                    <Calendar className="h-4 w-4 mr-1" />
                    Examine
                  </Button>
                </TableCell>
              </>
            )}

            {type === 'sick_pen' && (
              <>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {animal.diagnosis && (
                      <AlertTriangle className="h-4 w-4 text-orange-500" />
                    )}
                    <span className="text-sm">{animal.diagnosis || 'Not specified'}</span>
                  </div>
                </TableCell>
                <TableCell>
                  {animal.treatment_date
                    ? new Date(animal.treatment_date).toLocaleDateString()
                    : '-'}
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onAction?.(animal.id, 'treatment')}
                  >
                    <Syringe className="h-4 w-4 mr-1" />
                    Treat
                  </Button>
                </TableCell>
              </>
            )}

            {type === 'active_treatments' && (
              <>
                <TableCell>
                  <span className="text-sm">{animal.diagnosis || 'Not specified'}</span>
                </TableCell>
                <TableCell>
                  {animal.withdrawal_end_date
                    ? new Date(animal.withdrawal_end_date).toLocaleDateString()
                    : '-'}
                </TableCell>
                <TableCell>
                  {animal.withdrawal_days_remaining !== null && (
                    <Badge
                      variant="outline"
                      className={
                        animal.withdrawal_days_remaining <= 2
                          ? 'bg-green-100 text-green-800 hover:bg-green-100'
                          : animal.withdrawal_days_remaining <= 5
                          ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100'
                          : 'bg-red-100 text-red-800 hover:bg-red-100'
                      }
                    >
                      {animal.withdrawal_days_remaining} days
                    </Badge>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onAction?.(animal.id, 'treatment')}
                  >
                    Update
                  </Button>
                </TableCell>
              </>
            )}

            {type === 'scheduled' && (
              <>
                <TableCell>-</TableCell>
                <TableCell>-</TableCell>
                <TableCell className="text-right">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onAction?.(animal.id, 'exam')}
                  >
                    Complete
                  </Button>
                </TableCell>
              </>
            )}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
