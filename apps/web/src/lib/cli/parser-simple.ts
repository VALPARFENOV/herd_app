/**
 * Simple regex-based parser for DairyComp LIST commands
 * This is a Phase 1 implementation - Phase 3 will replace with Chevrotain
 */

export interface CommandAST {
  command: string
  items?: string[]
  conditions?: Condition[]
  sortBy?: SortClause
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
