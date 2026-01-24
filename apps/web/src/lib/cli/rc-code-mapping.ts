/**
 * RC Code Mapping for DairyComp compatibility
 * Maps between numeric RC codes (0-8) and reproductive_status strings
 */

export const RC_CODE_TO_STATUS: Record<number, string> = {
  0: 'blank',
  1: 'dnb',        // Do Not Breed
  2: 'fresh',      // Recently calved
  3: 'open',       // Not bred
  4: 'bred',       // Inseminated
  5: 'preg',       // Pregnant
  6: 'dry',        // Dried off
  7: 'sold',       // Sold or died
  8: 'bullcalf',   // Bull calf
}

export const STATUS_TO_RC_CODE: Record<string, number> = {
  blank: 0,
  dnb: 1,
  fresh: 2,
  open: 3,
  bred: 4,
  preg: 5,
  pregnant: 5,   // Alias
  dry: 6,
  sold: 7,
  died: 7,
  bullcalf: 8,
}

export function rcCodeToStatus(code: number): string {
  return RC_CODE_TO_STATUS[code] || 'blank'
}

export function statusToRcCode(status: string): number {
  return STATUS_TO_RC_CODE[status.toLowerCase()] || 0
}

export function getRCLabel(code: number): string {
  const labels: Record<number, string> = {
    0: 'Blank',
    1: 'DNB',
    2: 'FRESH',
    3: 'OPEN',
    4: 'BRED',
    5: 'PREG',
    6: 'DRY',
    7: 'SOLD',
    8: 'BULLCALF',
  }
  return labels[code] || 'Blank'
}
