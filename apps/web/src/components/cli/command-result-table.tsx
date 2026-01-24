'use client'

import { useRouter } from 'next/navigation'
import { formatResultData } from '@/lib/cli/executor'

interface CommandResultTableProps {
  data: any[]
  columns: string[]
}

export function CommandResultTable({ data, columns }: CommandResultTableProps) {
  const router = useRouter()

  if (!data || data.length === 0) {
    return null
  }

  // Format data for display
  const formattedData = formatResultData(data, columns)

  const handleRowClick = (row: any) => {
    // Navigate to animal detail page if ID column exists
    if (row.ID || row.id) {
      const animalId = data[formattedData.indexOf(row)]?.id
      if (animalId) {
        router.push(`/animals/${animalId}`)
      }
    }
  }

  return (
    <div className="overflow-hidden rounded-lg border border-gray-700">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-b border-gray-700 bg-gray-800">
            <tr>
              {columns.map((column) => (
                <th
                  key={column}
                  className="px-6 py-3 text-left font-mono text-xs font-medium uppercase tracking-wider text-gray-400"
                >
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800 bg-gray-900/50">
            {formattedData.map((row, rowIndex) => (
              <tr
                key={rowIndex}
                onClick={() => handleRowClick(row)}
                className="cursor-pointer transition-colors hover:bg-gray-800/50"
              >
                {columns.map((column) => (
                  <td
                    key={`${rowIndex}-${column}`}
                    className="whitespace-nowrap px-6 py-4 font-mono text-sm text-gray-300"
                  >
                    {renderCellValue(row[column], column)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Footer with row count */}
      <div className="border-t border-gray-700 bg-gray-800 px-6 py-3">
        <div className="text-xs text-gray-400">
          Showing {formattedData.length} {formattedData.length === 1 ? 'row' : 'rows'}
        </div>
      </div>
    </div>
  )
}

/**
 * Render cell value with appropriate formatting
 */
function renderCellValue(value: any, column: string): React.ReactNode {
  if (value === null || value === undefined || value === '') {
    return <span className="text-gray-600">—</span>
  }

  // RC code with color coding
  if (column === 'RC' || column === 'RPRO') {
    return <RCBadge value={value} />
  }

  // Numeric values
  if (typeof value === 'number') {
    return value.toLocaleString()
  }

  return value
}

/**
 * RC (Reproductive Code) badge with color coding
 */
function RCBadge({ value }: { value: number }) {
  const rcColors: Record<number, string> = {
    0: 'bg-gray-700 text-gray-300',      // Blank
    1: 'bg-red-900/50 text-red-300',     // DNB
    2: 'bg-blue-900/50 text-blue-300',   // FRESH
    3: 'bg-yellow-900/50 text-yellow-300', // OPEN
    4: 'bg-orange-900/50 text-orange-300', // BRED
    5: 'bg-green-900/50 text-green-300', // PREG
    6: 'bg-purple-900/50 text-purple-300', // DRY
    7: 'bg-gray-800 text-gray-400',      // SOLD/DIED
    8: 'bg-pink-900/50 text-pink-300',   // BULLCALF
  }

  const rcLabels: Record<number, string> = {
    0: 'BLANK',
    1: 'DNB',
    2: 'FRESH',
    3: 'OPEN',
    4: 'BRED',
    5: 'PREG',
    6: 'DRY',
    7: 'SOLD',
    8: 'CALF',
  }

  const colorClass = rcColors[value] || 'bg-gray-700 text-gray-300'
  const label = rcLabels[value] || value

  return (
    <span
      className={`inline-flex items-center rounded px-2 py-0.5 text-xs font-medium ${colorClass}`}
    >
      {value} - {label}
    </span>
  )
}
