/**
 * Mapping between DairyComp 305 item codes and HerdMaster Pro database fields
 */

export interface FieldMapping {
  dairyCompCode: string
  dbField: string
  description: string
  type: 'string' | 'number' | 'date' | 'boolean'
  category: 'identification' | 'dates' | 'reproduction' | 'production' | 'calculated' | 'health' | 'management'
}

/**
 * Complete mapping of DairyComp items to database fields
 */
export const FIELD_MAPPINGS: FieldMapping[] = [
  // Identification (Items 1-10)
  { dairyCompCode: 'ID', dbField: 'ear_tag', description: 'Animal identifier', type: 'string', category: 'identification' },
  { dairyCompCode: 'PEN', dbField: 'pen_id', description: 'Pen number', type: 'string', category: 'identification' },
  { dairyCompCode: 'REG', dbField: 'registration_number', description: 'Registration number', type: 'string', category: 'identification' },
  { dairyCompCode: 'EID', dbField: 'electronic_id', description: 'Electronic ID (RFID)', type: 'string', category: 'identification' },
  { dairyCompCode: 'NAME', dbField: 'name', description: 'Animal name', type: 'string', category: 'identification' },

  // Dates (Items 11-43)
  { dairyCompCode: 'BDAT', dbField: 'birth_date', description: 'Birth date', type: 'date', category: 'dates' },
  { dairyCompCode: 'EDAT', dbField: 'enrollment_date', description: 'Enrollment date', type: 'date', category: 'dates' },
  { dairyCompCode: 'FDAT', dbField: 'last_calving_date', description: 'Fresh date (calving)', type: 'date', category: 'dates' },
  { dairyCompCode: 'CDAT', dbField: 'conception_date', description: 'Conception date', type: 'date', category: 'dates' },
  { dairyCompCode: 'DDAT', dbField: 'dry_date', description: 'Dry off date', type: 'date', category: 'dates' },
  { dairyCompCode: 'HDAT', dbField: 'last_heat_date', description: 'Last heat date', type: 'date', category: 'dates' },

  // Reproductive Status (Items 13-28)
  { dairyCompCode: 'LACT', dbField: 'lactation_number', description: 'Lactation number', type: 'number', category: 'reproduction' },
  { dairyCompCode: 'RC', dbField: 'reproductive_status', description: 'Reproductive code (0-8)', type: 'number', category: 'reproduction' },
  { dairyCompCode: 'RPRO', dbField: 'reproductive_status', description: 'Reproductive code (alias)', type: 'number', category: 'reproduction' },
  { dairyCompCode: 'TBRD', dbField: 'tbrd', description: 'Times bred this lactation', type: 'number', category: 'reproduction' },
  { dairyCompCode: 'SPC', dbField: 'spc', description: 'Services per conception', type: 'number', category: 'reproduction' },
  { dairyCompCode: 'SIRC', dbField: 'sirc', description: 'Sire of conception (bull ID)', type: 'string', category: 'reproduction' },
  { dairyCompCode: 'SIRC_NAME', dbField: 'sirc_name', description: 'Sire of conception (bull name)', type: 'string', category: 'reproduction' },
  { dairyCompCode: 'SIR1', dbField: 'recent_sire_ids', description: 'Last 4 breeding bulls (IDs)', type: 'string', category: 'reproduction' },
  { dairyCompCode: 'SIRS', dbField: 'recent_sire_names', description: 'Last 4 breeding bulls (names)', type: 'string', category: 'reproduction' },
  { dairyCompCode: 'LSIR', dbField: 'last_breeding_bull_id', description: 'Last service sire', type: 'string', category: 'reproduction' },
  { dairyCompCode: 'HINT', dbField: 'hint', description: 'Heat interval (days)', type: 'number', category: 'reproduction' },
  { dairyCompCode: 'DCCP', dbField: 'dccp', description: 'DCC at pregnancy check (days)', type: 'number', category: 'reproduction' },
  { dairyCompCode: 'CALF_IDS', dbField: 'recent_calf_ids', description: 'Recent calf IDs (last 3)', type: 'string', category: 'reproduction' },
  { dairyCompCode: 'CALF_TAGS', dbField: 'recent_calf_ear_tags', description: 'Recent calf ear tags (last 3)', type: 'string', category: 'reproduction' },

  // Production - Current Lactation (Items 44-55)
  { dairyCompCode: 'TOTM', dbField: 'totm', description: 'Total milk this lactation (kg)', type: 'number', category: 'production' },
  { dairyCompCode: 'TOTF', dbField: 'totf', description: 'Total fat this lactation (kg)', type: 'number', category: 'production' },
  { dairyCompCode: 'TOTP', dbField: 'totp', description: 'Total protein this lactation (kg)', type: 'number', category: 'production' },
  { dairyCompCode: '305ME', dbField: '305me', description: '305-day Mature Equivalent milk', type: 'number', category: 'production' },
  { dairyCompCode: 'MILK', dbField: 'last_milk_kg', description: 'Last test day milk (kg)', type: 'number', category: 'production' },
  { dairyCompCode: 'SCC', dbField: 'last_scc', description: 'Somatic cell count', type: 'number', category: 'production' },
  { dairyCompCode: 'LGSCC', dbField: 'lgscc', description: 'Log SCC (base 10)', type: 'number', category: 'production' },
  { dairyCompCode: 'FCM', dbField: 'fcm', description: 'Fat Corrected Milk (3.5%)', type: 'number', category: 'production' },
  { dairyCompCode: 'PCTF', dbField: 'last_fat_percent', description: 'Fat percentage', type: 'number', category: 'production' },
  { dairyCompCode: 'PCTP', dbField: 'last_protein_percent', description: 'Protein percentage', type: 'number', category: 'production' },

  // Production - Previous Lactation (Items 56-62)
  { dairyCompCode: 'PDIM', dbField: 'pdim', description: 'Previous lactation DIM', type: 'number', category: 'production' },
  { dairyCompCode: 'PDOPN', dbField: 'pdopn', description: 'Previous lactation days open', type: 'number', category: 'production' },
  { dairyCompCode: 'PTBRD', dbField: 'ptbrd', description: 'Previous lactation times bred', type: 'number', category: 'production' },
  { dairyCompCode: 'PTOTM', dbField: 'ptotm', description: 'Previous lactation total milk (kg)', type: 'number', category: 'production' },
  { dairyCompCode: 'PTOTF', dbField: 'ptotf', description: 'Previous lactation total fat (kg)', type: 'number', category: 'production' },
  { dairyCompCode: 'PTOTP', dbField: 'ptotp', description: 'Previous lactation total protein (kg)', type: 'number', category: 'production' },

  // Calculated Status (Items 75-87)
  { dairyCompCode: 'DIM', dbField: 'dim', description: 'Days in milk', type: 'number', category: 'calculated' },
  { dairyCompCode: 'DOPN', dbField: 'days_open', description: 'Days open', type: 'number', category: 'calculated' },
  { dairyCompCode: 'DDRY', dbField: 'ddry', description: 'Days dry', type: 'number', category: 'calculated' },
  { dairyCompCode: 'DCC', dbField: 'dcc', description: 'Days carrying calf (days pregnant)', type: 'number', category: 'calculated' },
  { dairyCompCode: 'DUE', dbField: 'due', description: 'Days until calving (negative=overdue)', type: 'number', category: 'calculated' },
  { dairyCompCode: 'DSLH', dbField: 'days_since_last_heat', description: 'Days since last heat', type: 'number', category: 'calculated' },
  { dairyCompCode: 'DSLB', dbField: 'days_since_last_breeding', description: 'Days since last breeding', type: 'number', category: 'calculated' },
  { dairyCompCode: 'AGE', dbField: 'age_months', description: 'Age in months', type: 'number', category: 'calculated' },
  { dairyCompCode: 'AGEFR', dbField: 'agefr', description: 'Age at first calving (months)', type: 'number', category: 'calculated' },

  // Health
  { dairyCompCode: 'VC', dbField: 'vet_code', description: 'Veterinary code', type: 'number', category: 'health' },
  { dairyCompCode: 'BCS', dbField: 'last_body_condition_score', description: 'Body condition score', type: 'number', category: 'health' },

  // Management
  { dairyCompCode: 'NOTE', dbField: 'permanent_note', description: 'Permanent note', type: 'string', category: 'management' },
]

/**
 * Create lookup maps for fast access
 */
const DAIRY_COMP_TO_DB = new Map<string, string>()
const DB_TO_DAIRY_COMP = new Map<string, string>()
const ITEM_INFO = new Map<string, FieldMapping>()

// Build maps
for (const mapping of FIELD_MAPPINGS) {
  DAIRY_COMP_TO_DB.set(mapping.dairyCompCode, mapping.dbField)
  DB_TO_DAIRY_COMP.set(mapping.dbField, mapping.dairyCompCode)
  ITEM_INFO.set(mapping.dairyCompCode, mapping)
}

/**
 * Convert DairyComp item code to database field name
 */
export function dairyCompToDb(itemCode: string): string | null {
  return DAIRY_COMP_TO_DB.get(itemCode.toUpperCase()) || null
}

/**
 * Convert database field name to DairyComp item code
 */
export function dbToDairyComp(dbField: string): string | null {
  return DB_TO_DAIRY_COMP.get(dbField) || null
}

/**
 * Get information about a DairyComp item
 */
export function getItemInfo(itemCode: string): FieldMapping | null {
  return ITEM_INFO.get(itemCode.toUpperCase()) || null
}

/**
 * Get all DairyComp item codes
 */
export function getAllItemCodes(): string[] {
  return Array.from(DAIRY_COMP_TO_DB.keys())
}

/**
 * Get items by category
 */
export function getItemsByCategory(category: FieldMapping['category']): FieldMapping[] {
  return FIELD_MAPPINGS.filter(m => m.category === category)
}

/**
 * RC (Reproductive Code) value mappings
 */
export const RC_VALUES = {
  0: { label: 'Blank', description: 'Young calves/heifers not bred' },
  1: { label: 'DNB', description: 'Do Not Breed' },
  2: { label: 'FRESH', description: 'Recently calved' },
  3: { label: 'OPEN', description: 'Ready to breed / checked and open' },
  4: { label: 'BRED', description: 'Inseminated, not diagnosed' },
  5: { label: 'PREG', description: 'Pregnant' },
  6: { label: 'DRY', description: 'Dry period (not milking)' },
  7: { label: 'SLD/DIE', description: 'Sold or died' },
  8: { label: 'BULLCAF', description: 'Bull calf' },
} as const

/**
 * VC (Veterinary Code) value mappings
 */
export const VC_VALUES = {
  1: { label: 'CHCK', description: 'Check - needs examination' },
  2: { label: 'FRSH', description: 'Fresh - exam before breeding' },
  3: { label: 'PREG', description: 'Pregnancy check due' },
  4: { label: 'REPG', description: 'Recheck pregnancy' },
  5: { label: 'ODUE', description: 'Overdue - pregnant ≥300 DCC' },
  6: { label: 'ABT?', description: 'Abort? - heat while pregnant' },
  7: { label: 'CYST', description: 'Cystic - rebred within 10 days' },
  8: { label: 'NOHT', description: 'No heat - bred but not rebred (30d)' },
  9: { label: 'NOHT', description: 'No heat - too many DIM without breeding (90d)' },
  10: { label: 'PROB', description: 'Problem breeder' },
  11: { label: 'XBRD', description: 'Extra bred - 3+ times before pregnant' },
} as const

/**
 * Validate if a field supports a specific operator
 */
export function isValidOperator(
  itemCode: string,
  operator: '=' | '>' | '<' | '>=' | '<=' | '<>'
): boolean {
  const info = getItemInfo(itemCode)
  if (!info) return false

  // String fields only support = and <>
  if (info.type === 'string') {
    return operator === '=' || operator === '<>'
  }

  // Numbers, dates, and booleans support all operators
  return true
}

/**
 * Get suggested values for an item code
 */
export function getSuggestedValues(itemCode: string): Array<{ value: string | number, label: string }> {
  const upper = itemCode.toUpperCase()

  if (upper === 'RC' || upper === 'RPRO') {
    return Object.entries(RC_VALUES).map(([value, info]) => ({
      value: parseInt(value),
      label: `${value} - ${info.label}: ${info.description}`
    }))
  }

  if (upper === 'VC') {
    return Object.entries(VC_VALUES).map(([value, info]) => ({
      value: parseInt(value),
      label: `${value} - ${info.label}: ${info.description}`
    }))
  }

  return []
}
