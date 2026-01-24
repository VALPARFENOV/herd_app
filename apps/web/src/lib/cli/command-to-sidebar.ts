/**
 * Map CLI commands to sidebar sections
 * Determines which sidebar section should be highlighted based on command
 */

import { CommandAST } from './parser-simple'

export type SidebarSection =
  | 'fresh-cows'
  | 'to-breed'
  | 'pregnancy-check'
  | 'dry-off'
  | 'vet-list'
  | 'alerts'
  | null

/**
 * Determine which sidebar section corresponds to a command
 */
export function commandToSidebarSection(ast: CommandAST): SidebarSection {
  // Check if command has conditions
  if (!ast.conditions || ast.conditions.length === 0) {
    return null
  }

  // Fresh Cows: DIM < 21 or RC = 2
  const hasFreshCondition = ast.conditions.some(
    (c) =>
      (c.field === 'DIM' && c.operator === '<' && Number(c.value) <= 21) ||
      (c.field === 'RC' && c.operator === '=' && c.value === 2)
  )
  if (hasFreshCondition) {
    return 'fresh-cows'
  }

  // To Breed: RC = 3 and optionally DIM > 60
  const hasToBreedCondition = ast.conditions.some(
    (c) => c.field === 'RC' && c.operator === '=' && c.value === 3
  )
  if (hasToBreedCondition) {
    return 'to-breed'
  }

  // Pregnancy Check: RC = 4 (BRED)
  const hasPregCheckCondition = ast.conditions.some(
    (c) => c.field === 'RC' && c.operator === '=' && c.value === 4
  )
  if (hasPregCheckCondition) {
    return 'pregnancy-check'
  }

  // Pregnant: RC = 5
  const hasPregnantCondition = ast.conditions.some(
    (c) => c.field === 'RC' && c.operator === '=' && c.value === 5
  )

  // Dry Off: RC = 5 with DCC > 220 or RC = 6
  const hasDryOffCondition = ast.conditions.some(
    (c) =>
      (c.field === 'RC' && c.operator === '=' && c.value === 6) ||
      (c.field === 'DCC' && c.operator === '>' && Number(c.value) >= 220)
  )
  if (hasDryOffCondition || (hasPregnantCondition && ast.conditions.some(c => c.field === 'DCC'))) {
    return 'dry-off'
  }

  // Alerts: High SCC
  const hasHighSccCondition = ast.conditions.some(
    (c) =>
      c.field === 'SCC' &&
      (c.operator === '>' || c.operator === '>=') &&
      Number(c.value) >= 200
  )
  if (hasHighSccCondition) {
    return 'alerts'
  }

  return null
}

/**
 * Get command template for a sidebar section
 */
export function sidebarSectionToCommand(section: SidebarSection): string | null {
  switch (section) {
    case 'fresh-cows':
      return 'LIST ID PEN LACT DIM FOR DIM<21'
    case 'to-breed':
      return 'LIST ID PEN LACT DIM FOR RC=3 DIM>60'
    case 'pregnancy-check':
      return 'LIST ID PEN LACT DIM FOR RC=4'
    case 'dry-off':
      return 'LIST ID PEN RC DCC FOR RC=5 DCC>220'
    case 'vet-list':
      return 'LIST ID PEN LACT DIM VC FOR VC>0'
    case 'alerts':
      return 'LIST ID PEN MILK SCC FOR SCC>200'
    default:
      return null
  }
}

/**
 * Map sidebar section to route
 */
export function sidebarSectionToRoute(section: SidebarSection): string {
  switch (section) {
    case 'fresh-cows':
      return '/animals?filter=fresh'
    case 'to-breed':
      return '/animals?filter=to-breed'
    case 'pregnancy-check':
      return '/animals?filter=preg-check'
    case 'dry-off':
      return '/animals?filter=dry-off'
    case 'vet-list':
      return '/vet'
    case 'alerts':
      return '/animals?filter=alerts'
    default:
      return '/animals'
  }
}

/**
 * Map sidebar Quick Access item name to section ID
 */
export function quickAccessNameToSection(name: string): SidebarSection {
  switch (name) {
    case 'Fresh Cows':
      return 'fresh-cows'
    case 'To Breed':
      return 'to-breed'
    case 'Pregnancy Check':
      return 'pregnancy-check'
    case 'Dry Off':
      return 'dry-off'
    case 'Vet List':
      return 'vet-list'
    case 'Alerts':
      return 'alerts'
    default:
      return null
  }
}
