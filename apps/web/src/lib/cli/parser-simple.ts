/**
 * Simple regex-based parser for DairyComp LIST commands
 * This is a Phase 1 implementation - Phase 3 will replace with Chevrotain
 */

export interface CommandAST {
  command: string
  items?: string[]
  conditions?: Condition[]
  sortBy?: SortClause
  groupBy?: string // For COUNT BY, SUM BY
  switches?: string[]
  raw: string
}

export interface Condition {
  field: string
  operator: '=' | '>' | '<' | '>=' | '<=' | '<>'
  value: string | number
}

export interface SortClause {
  field: string
  descending: boolean
}

export interface ParseError {
  message: string
  position?: number
}

/**
 * Parse DairyComp LIST command
 *
 * Syntax: LIST [items...] [FOR conditions...] [BY field] [\switches]
 *
 * Examples:
 * - LIST ID PEN LACT DIM FOR RC=5
 * - LIST ID FOR RC=3 DIM>60 BY PEN
 * - LIST ID MILK SCC FOR SCC>200 DOWNBY SCC \A
 */
export function parseListCommand(command: string): CommandAST | ParseError {
  const trimmed = command.trim()
  const upper = trimmed.toUpperCase()

  // Must start with LIST or SHOW
  if (!upper.startsWith('LIST') && !upper.startsWith('SHOW')) {
    return {
      message: 'Command must start with LIST or SHOW',
      position: 0
    }
  }

  try {
    // Extract command word
    const commandMatch = trimmed.match(/^(LIST|SHOW)\s*/i)
    if (!commandMatch) {
      return { message: 'Invalid command' }
    }

    let remaining = trimmed.slice(commandMatch[0].length)

    // Extract switches (\A, \B, \T, etc.) - they can appear anywhere
    const switches: string[] = []
    const switchPattern = /\\([A-Z0-9]+)/gi
    let switchMatch
    while ((switchMatch = switchPattern.exec(remaining)) !== null) {
      switches.push(switchMatch[1])
    }
    // Remove switches from remaining
    remaining = remaining.replace(switchPattern, '').trim()

    // Extract sort clause (BY or DOWNBY)
    let sortBy: SortClause | undefined
    const sortMatch = remaining.match(/(DOWN)?BY\s+([A-Z][A-Z0-9]*)/i)
    if (sortMatch) {
      sortBy = {
        field: sortMatch[2].toUpperCase(),
        descending: sortMatch[1] !== undefined
      }
      // Remove sort clause
      remaining = remaining.slice(0, sortMatch.index).trim()
    }

    // Extract conditions (FOR clause)
    const conditions: Condition[] = []
    const forMatch = remaining.match(/\s+FOR\s+/i)
    if (forMatch && forMatch.index !== undefined) {
      const conditionsString = remaining.slice(forMatch.index + forMatch[0].length)
      remaining = remaining.slice(0, forMatch.index).trim()

      // Parse conditions
      const conditionTokens = conditionsString.split(/\s+AND\s+/i)
      for (const token of conditionTokens) {
        const cond = parseCondition(token.trim())
        if (cond) {
          conditions.push(cond)
        }
      }
    }

    // What's left are items
    const items: string[] = []
    if (remaining) {
      const itemTokens = remaining.split(/\s+/)
      for (const token of itemTokens) {
        if (token && /^[A-Z][A-Z0-9]*$/i.test(token)) {
          items.push(token.toUpperCase())
        }
      }
    }

    return {
      command: commandMatch[1].toUpperCase(),
      items: items.length > 0 ? items : undefined,
      conditions: conditions.length > 0 ? conditions : undefined,
      sortBy,
      switches: switches.length > 0 ? switches : undefined,
      raw: trimmed
    }

  } catch (error) {
    return {
      message: error instanceof Error ? error.message : 'Parse error',
    }
  }
}

/**
 * Parse a single condition
 * Examples: RC=5, DIM>60, SCC<=200, LACT<>0
 */
function parseCondition(token: string): Condition | null {
  // Try operators in order of length (longest first)
  const operators: Array<'<=' | '>=' | '<>' | '=' | '>' | '<'> = ['<=', '>=', '<>', '=', '>', '<']

  for (const op of operators) {
    const parts = token.split(op)
    if (parts.length === 2) {
      const field = parts[0].trim().toUpperCase()
      const value = parts[1].trim()

      // Try to parse as number
      const numValue = parseFloat(value)
      const finalValue = isNaN(numValue) ? value.toUpperCase() : numValue

      return {
        field,
        operator: op,
        value: finalValue
      }
    }
  }

  return null
}

/**
 * Validate if a string is a valid DairyComp command
 */
export function isValidCommand(command: string): boolean {
  const upper = command.trim().toUpperCase()
  const validStarts = [
    'LIST', 'SHOW', 'COUNT', 'SUM', 'PCT',
    'GRAPH', 'PLOT', 'EGRAPH', 'EPLOT',
    'EVENTS', 'BREDSUM', 'ECON', 'MONITOR',
    'COWVAL', 'SIRES', 'FILEOUT', 'CHKFILE'
  ]

  return validStarts.some(cmd => upper.startsWith(cmd))
}

/**
 * Get command type from input
 */
export function getCommandType(command: string): string | null {
  const match = command.trim().match(/^([A-Z]+)/i)
  return match ? match[1].toUpperCase() : null
}

/**
 * Main parser - dispatches to appropriate command parser
 */
export function parseCommand(command: string): CommandAST | ParseError {
  const commandType = getCommandType(command)

  switch (commandType) {
    case 'LIST':
    case 'SHOW':
      return parseListCommand(command)

    case 'COUNT':
      return parseCountCommand(command)

    case 'SUM':
      return parseSumCommand(command)

    case 'BREDSUM':
      return parseBredsumCommand(command)

    case 'PLOT':
      return parsePlotCommand(command)

    case 'EVENTS':
      return parseEventsCommand(command)

    case 'ECON':
      return parseEconCommand(command)

    case 'COWVAL':
      return parseCowvalCommand(command)

    default:
      return {
        message: `Command ${commandType} not yet supported`
      }
  }
}

/**
 * Parse COUNT command
 *
 * Syntax:
 * - COUNT ID - simple count
 * - COUNT ID FOR RC=5 - count with conditions
 * - COUNT BY PEN - grouped count
 * - COUNT ID BY RC FOR DIM>60 - grouped count with conditions
 */
export function parseCountCommand(command: string): CommandAST | ParseError {
  const trimmed = command.trim()
  const upper = trimmed.toUpperCase()

  if (!upper.startsWith('COUNT')) {
    return {
      message: 'Command must start with COUNT',
      position: 0
    }
  }

  try {
    let remaining = trimmed.slice(5).trim() // Remove 'COUNT'

    // Extract conditions (FOR clause)
    const conditions: Condition[] = []
    const forMatch = remaining.match(/\s+FOR\s+/i)
    if (forMatch && forMatch.index !== undefined) {
      const conditionsString = remaining.slice(forMatch.index + forMatch[0].length)
      remaining = remaining.slice(0, forMatch.index).trim()

      // Parse conditions
      const conditionTokens = conditionsString.split(/\s+AND\s+/i)
      for (const token of conditionTokens) {
        const cond = parseCondition(token.trim())
        if (cond) {
          conditions.push(cond)
        }
      }
    }

    // Extract groupBy clause (BY field)
    let groupBy: string | undefined
    const byMatch = remaining.match(/\s+BY\s+([A-Z][A-Z0-9]*)/i)
    if (byMatch) {
      groupBy = byMatch[1].toUpperCase()
      remaining = remaining.slice(0, byMatch.index).trim()
    }

    // What's left are items (usually just ID)
    const items: string[] = []
    if (remaining) {
      const itemTokens = remaining.split(/\s+/)
      for (const token of itemTokens) {
        if (token && /^[A-Z][A-Z0-9]*$/i.test(token)) {
          items.push(token.toUpperCase())
        }
      }
    }

    return {
      command: 'COUNT',
      items: items.length > 0 ? items : undefined,
      conditions: conditions.length > 0 ? conditions : undefined,
      groupBy,
      raw: trimmed
    }

  } catch (error) {
    return {
      message: error instanceof Error ? error.message : 'Parse error'
    }
  }
}

/**
 * Parse SUM command
 *
 * Syntax:
 * - SUM MILK LACT \A - averages (default)
 * - SUM MILK LACT \T - totals
 * - SUM MILK BY PEN \A - grouped averages
 * - SUM MILK SCC \T BY RC FOR LACT=2 - grouped totals with conditions
 */
export function parseSumCommand(command: string): CommandAST | ParseError {
  const trimmed = command.trim()
  const upper = trimmed.toUpperCase()

  if (!upper.startsWith('SUM')) {
    return {
      message: 'Command must start with SUM',
      position: 0
    }
  }

  try {
    let remaining = trimmed.slice(3).trim() // Remove 'SUM'

    // Extract switches (\A, \T, etc.)
    const switches: string[] = []
    const switchPattern = /\\([A-Z0-9]+)/gi
    let switchMatch
    while ((switchMatch = switchPattern.exec(remaining)) !== null) {
      switches.push(switchMatch[1])
    }
    // Remove switches from remaining
    remaining = remaining.replace(switchPattern, '').trim()

    // Extract conditions (FOR clause)
    const conditions: Condition[] = []
    const forMatch = remaining.match(/\s+FOR\s+/i)
    if (forMatch && forMatch.index !== undefined) {
      const conditionsString = remaining.slice(forMatch.index + forMatch[0].length)
      remaining = remaining.slice(0, forMatch.index).trim()

      // Parse conditions
      const conditionTokens = conditionsString.split(/\s+AND\s+/i)
      for (const token of conditionTokens) {
        const cond = parseCondition(token.trim())
        if (cond) {
          conditions.push(cond)
        }
      }
    }

    // Extract groupBy clause (BY field)
    let groupBy: string | undefined
    const byMatch = remaining.match(/\s+BY\s+([A-Z][A-Z0-9]*)/i)
    if (byMatch) {
      groupBy = byMatch[1].toUpperCase()
      remaining = remaining.slice(0, byMatch.index).trim()
    }

    // What's left are items (fields to aggregate)
    const items: string[] = []
    if (remaining) {
      const itemTokens = remaining.split(/\s+/)
      for (const token of itemTokens) {
        if (token && /^[A-Z][A-Z0-9]*$/i.test(token)) {
          items.push(token.toUpperCase())
        }
      }
    }

    return {
      command: 'SUM',
      items: items.length > 0 ? items : undefined,
      conditions: conditions.length > 0 ? conditions : undefined,
      groupBy,
      switches: switches.length > 0 ? switches : undefined,
      raw: trimmed
    }

  } catch (error) {
    return {
      message: error instanceof Error ? error.message : 'Parse error'
    }
  }
}

/**
 * Parse BREDSUM command
 *
 * Syntax:
 * - BREDSUM - basic breeding summary by lactation
 * - BREDSUM \B - by service number
 * - BREDSUM \C - by calendar month
 * - BREDSUM \T - by technician
 * - BREDSUM \S - by sire
 * - BREDSUM \P - by pen
 * - BREDSUM \E - 21-day pregnancy rates
 * - BREDSUM \H - heat detection
 * - BREDSUM \Q - Q-Sum cumulative conception rate
 * - BREDSUM \N - by DIM range
 * - BREDSUM \W - by day of week
 * - BREDSUM \PG - prostaglandin protocols
 */
export function parseBredsumCommand(command: string): CommandAST | ParseError {
  const trimmed = command.trim()
  const upper = trimmed.toUpperCase()

  if (!upper.startsWith('BREDSUM')) {
    return {
      message: 'Command must start with BREDSUM',
      position: 0
    }
  }

  try {
    let remaining = trimmed.slice(7).trim() // Remove 'BREDSUM'

    // Extract switches (\B, \C, \T, \S, \P, \E, \H, \Q, \N, \W, \PG)
    const switches: string[] = []
    const switchPattern = /\\([A-Z0-9]+)/gi
    let switchMatch
    while ((switchMatch = switchPattern.exec(remaining)) !== null) {
      switches.push(switchMatch[1].toUpperCase())
    }

    // BREDSUM typically doesn't have items or conditions
    // It operates on all breeding data within a date range (handled by RPC functions)

    return {
      command: 'BREDSUM',
      switches: switches.length > 0 ? switches : undefined,
      raw: trimmed
    }

  } catch (error) {
    return {
      message: error instanceof Error ? error.message : 'Parse error'
    }
  }
}

/**
 * Parse PLOT command
 *
 * Syntax:
 * - PLOT MILK BY DIM - Lactation curves
 * - PLOT MILK BY TDAT - Time series
 * - PLOT 305ME BY LACT - Group comparison
 * - PLOT MILK BY PEN - Location comparison
 * - PLOT MILK FAT PROTEIN BY DIM - Multiple fields
 */
export function parsePlotCommand(command: string): CommandAST | ParseError {
  const trimmed = command.trim()
  const upper = trimmed.toUpperCase()

  if (!upper.startsWith('PLOT')) {
    return {
      message: 'Command must start with PLOT',
      position: 0
    }
  }

  try {
    let remaining = trimmed.slice(4).trim() // Remove 'PLOT'

    // Extract groupBy clause (BY field)
    let groupBy: string | undefined
    const byMatch = remaining.match(/\s+BY\s+([A-Z][A-Z0-9]*)/i)
    if (byMatch) {
      groupBy = byMatch[1].toUpperCase()
      remaining = remaining.slice(0, byMatch.index).trim()
    }

    // What's left are items (fields to plot)
    const items: string[] = []
    if (remaining) {
      const itemTokens = remaining.split(/\s+/)
      for (const token of itemTokens) {
        if (token && /^[A-Z][A-Z0-9]*$/i.test(token)) {
          items.push(token.toUpperCase())
        }
      }
    }

    return {
      command: 'PLOT',
      items: items.length > 0 ? items : undefined,
      groupBy,
      raw: trimmed
    }

  } catch (error) {
    return {
      message: error instanceof Error ? error.message : 'Parse error'
    }
  }
}

/**
 * Parse EVENTS command
 *
 * Syntax:
 * - EVENTS - Standard event listing
 * - EVENTS\si - Specific items display with custom fields
 * - EVENTS FOR RC=3 - With conditions
 */
export function parseEventsCommand(command: string): CommandAST | ParseError {
  const trimmed = command.trim()
  const upper = trimmed.toUpperCase()

  if (!upper.startsWith('EVENTS')) {
    return {
      message: 'Command must start with EVENTS',
      position: 0
    }
  }

  try {
    let remaining = trimmed.slice(6).trim() // Remove 'EVENTS'

    // Extract switches (\si, etc.)
    const switches: string[] = []
    const switchPattern = /\\([A-Z0-9]+)/gi
    let switchMatch
    while ((switchMatch = switchPattern.exec(remaining)) !== null) {
      switches.push(switchMatch[1].toUpperCase())
    }
    // Remove switches from remaining
    remaining = remaining.replace(switchPattern, '').trim()

    // Extract conditions (FOR clause) - similar to LIST command
    const conditions: Condition[] = []
    const forMatch = remaining.match(/\s+FOR\s+/i)
    if (forMatch && forMatch.index !== undefined) {
      const conditionsString = remaining.slice(forMatch.index + forMatch[0].length)
      remaining = remaining.slice(0, forMatch.index).trim()

      // Parse conditions
      const conditionTokens = conditionsString.split(/\s+AND\s+/i)
      for (const token of conditionTokens) {
        const cond = parseCondition(token.trim())
        if (cond) {
          conditions.push(cond)
        }
      }
    }

    // What's left are items (custom fields for \si variant)
    const items: string[] = []
    if (remaining) {
      const itemTokens = remaining.split(/\s+/)
      for (const token of itemTokens) {
        if (token && /^[A-Z][A-Z0-9]*$/i.test(token)) {
          items.push(token.toUpperCase())
        }
      }
    }

    return {
      command: 'EVENTS',
      items: items.length > 0 ? items : undefined,
      conditions: conditions.length > 0 ? conditions : undefined,
      switches: switches.length > 0 ? switches : undefined,
      raw: trimmed
    }

  } catch (error) {
    return {
      message: error instanceof Error ? error.message : 'Parse error'
    }
  }
}

/**
 * Parse ECON command (Economic analysis)
 *
 * Syntax: ECON [\variant]
 *
 * Variants:
 * - ECON - Basic economic summary (revenue, costs, IOFC)
 * - ECON\PEN - IOFC analysis by pen
 * - ECON\TREND or ECON\T - Profitability trends over time
 * - ECON\COSTS or ECON\C - Cost breakdown by type
 */
export function parseEconCommand(command: string): CommandAST | ParseError {
  const trimmed = command.trim()
  const upper = trimmed.toUpperCase()

  if (!upper.startsWith('ECON')) {
    return {
      message: 'Command must start with ECON',
      position: 0
    }
  }

  try {
    let remaining = trimmed.slice(4).trim() // Remove 'ECON'

    // Extract switches (\PEN, \TREND, \COSTS, etc.)
    const switches: string[] = []
    const switchPattern = /\\([A-Z0-9]+)/gi
    let switchMatch
    while ((switchMatch = switchPattern.exec(remaining)) !== null) {
      switches.push(switchMatch[1].toUpperCase())
    }

    return {
      command: 'ECON',
      switches: switches.length > 0 ? switches : undefined,
      raw: trimmed
    }

  } catch (error) {
    return {
      message: error instanceof Error ? error.message : 'Parse error'
    }
  }
}

/**
 * Parse COWVAL command (Cow valuation analysis)
 *
 * Syntax: COWVAL [\variant] [FOR conditions]
 *
 * Variants:
 * - COWVAL - Basic valuation report (sorted by relative value)
 * - COWVAL\UPDATE or COWVAL\U - Update all cow valuations
 * - COWVAL\SUMMARY or COWVAL\S - Herd-level valuation statistics
 * - COWVAL\TOP or COWVAL\T - Top 20 highest valued cows
 * - COWVAL\BOTTOM or COWVAL\B - Bottom 20 lowest valued cows (cull candidates)
 */
export function parseCowvalCommand(command: string): CommandAST | ParseError {
  const trimmed = command.trim()
  const upper = trimmed.toUpperCase()

  if (!upper.startsWith('COWVAL')) {
    return {
      message: 'Command must start with COWVAL',
      position: 0
    }
  }

  try {
    let remaining = trimmed.slice(6).trim() // Remove 'COWVAL'

    // Extract switches (\UPDATE, \SUMMARY, \TOP, \BOTTOM, etc.)
    const switches: string[] = []
    const switchPattern = /\\([A-Z0-9]+)/gi
    let switchMatch
    while ((switchMatch = switchPattern.exec(remaining)) !== null) {
      switches.push(switchMatch[1].toUpperCase())
    }
    // Remove switches from remaining
    remaining = remaining.replace(switchPattern, '').trim()

    // Extract conditions (FOR clause) - similar to LIST command
    const conditions: Condition[] = []
    const forMatch = remaining.match(/\s+FOR\s+/i)
    if (forMatch && forMatch.index !== undefined) {
      const conditionsString = remaining.slice(forMatch.index + forMatch[0].length)
      remaining = remaining.slice(0, forMatch.index).trim()

      // Parse conditions
      const conditionTokens = conditionsString.split(/\s+AND\s+/i)
      for (const token of conditionTokens) {
        const cond = parseCondition(token.trim())
        if (cond) {
          conditions.push(cond)
        }
      }
    }

    return {
      command: 'COWVAL',
      conditions: conditions.length > 0 ? conditions : undefined,
      switches: switches.length > 0 ? switches : undefined,
      raw: trimmed
    }

  } catch (error) {
    return {
      message: error instanceof Error ? error.message : 'Parse error'
    }
  }
}
