/**
 * DairyComp 305 Syntax Highlighter
 * Custom language definition for PrismJS with iTerm2-style colors
 */

export interface HighlightedToken {
  type: 'keyword' | 'operator' | 'item' | 'comparison' | 'number' | 'switch' | 'text'
  value: string
  color: string
}

// DairyComp command keywords
const KEYWORDS = [
  'LIST', 'SHOW', 'COUNT', 'SUM', 'PCT',
  'GRAPH', 'PLOT', 'EGRAPH', 'EPLOT',
  'EVENTS', 'BREDSUM', 'ECON', 'MONITOR',
  'COWVAL', 'SIRES', 'FILEOUT', 'CHKFILE',
  'ALTER', 'SETUP', 'LOGON', 'CREATE', 'ABSORB'
]

// Operators
const OPERATORS = ['FOR', 'BY', 'DOWNBY', 'AND', 'OR', 'SINCE', 'SORT']

// Standard items (89+ fields)
const ITEMS = [
  // Identification
  'ID', 'PEN', 'VC', 'REG', 'EID', 'CBRD', 'DID', 'DREG', 'DBRD', 'SID',
  // Dates
  'BDAT', 'EDAT', 'FDAT', 'CDAT', 'DDAT', 'HDAT', 'BLDAT', 'ABDAT', 'ADDAT', 'VDAT', 'TDAT', 'ARDAT',
  // Reproduction
  'LACT', 'RC', 'SIR1', 'SIR2', 'LSIR', 'SIRC', 'TBRD',
  // Production
  'TOTM', 'TOTF', 'TOTP', 'MILK', 'FCM', '305ME', 'PCTP', 'PCTF', 'SCC',
  // Previous lactation
  'PSIRC', 'PDIM', 'PDOPN', 'PTBRD', 'PTOTM', 'PTOTF', 'PTOTP',
  // Calculated
  'DIM', 'DOPN', 'DDRY', 'DUE', 'DCC', 'TODAY', 'DSLH', 'AGE',
  // Events
  'EDAY', 'EC', 'INT', 'REM',
  // Management
  'CNTL', 'RELV', 'TPEN', 'OLDID', 'CODA', 'COD1', 'COD2', 'XDAT', 'NOTE', 'TECH',
  // DHIA
  'STAT', 'CAR', 'PVET', 'VETC', 'RPRO',
  // Health
  'DCCP', 'HINT', 'CALF1', 'CALF2', 'CALF3',
  // PULSE items
  'BFDAT', 'MKDAT', 'LTDAT', 'COST', 'PN', 'HPDAT', 'RCDAT', 'THD',
  'SCDAT', 'SCTIM', 'SCMTH', 'SCPEN', 'BNAME', 'EASE', 'CWVAL', 'PGVAL',
  'SIR3', 'SIR4', 'SYDAT', 'CLIV', 'CVACC', 'SF', 'EXPCALF', 'NAME', 'AGEFR'
]

// Comparison operators
const COMPARISON_OPS = ['>=', '<=', '<>', '=', '>', '<']

// Color scheme (iTerm2 style)
const COLORS = {
  keyword: '#61AFEF',    // Blue
  operator: '#98C379',   // Green
  item: '#E5C07B',       // Yellow
  comparison: '#56B6C2', // Cyan
  number: '#D19A66',     // Orange
  switch: '#C678DD',     // Purple
  text: '#ABB2BF',       // Light gray
}

/**
 * Tokenize and highlight DairyComp command
 */
export function highlight(input: string): HighlightedToken[] {
  if (!input.trim()) {
    return []
  }

  const tokens: HighlightedToken[] = []
  const upperInput = input.toUpperCase()
  let position = 0

  while (position < input.length) {
    let matched = false

    // Skip whitespace
    if (input[position] === ' ') {
      tokens.push({
        type: 'text',
        value: ' ',
        color: COLORS.text
      })
      position++
      continue
    }

    // Match switches (\A, \B, \T, etc.)
    if (input[position] === '\\') {
      const switchMatch = input.slice(position).match(/^\\[A-Z0-9]+/i)
      if (switchMatch) {
        tokens.push({
          type: 'switch',
          value: switchMatch[0],
          color: COLORS.switch
        })
        position += switchMatch[0].length
        matched = true
        continue
      }
    }

    // Match comparison operators (must be before single char operators)
    for (const op of COMPARISON_OPS) {
      if (upperInput.slice(position, position + op.length) === op) {
        tokens.push({
          type: 'comparison',
          value: input.slice(position, position + op.length),
          color: COLORS.comparison
        })
        position += op.length
        matched = true
        break
      }
    }
    if (matched) continue

    // Match numbers (including decimals and dates)
    const numberMatch = input.slice(position).match(/^\d+(\.\d+)?/)
    if (numberMatch) {
      tokens.push({
        type: 'number',
        value: numberMatch[0],
        color: COLORS.number
      })
      position += numberMatch[0].length
      continue
    }

    // Match words (keywords, operators, items)
    const wordMatch = input.slice(position).match(/^[A-Z][A-Z0-9]*/i)
    if (wordMatch) {
      const word = wordMatch[0]
      const upperWord = word.toUpperCase()

      // Check if keyword
      if (KEYWORDS.includes(upperWord)) {
        tokens.push({
          type: 'keyword',
          value: word,
          color: COLORS.keyword
        })
      }
      // Check if operator
      else if (OPERATORS.includes(upperWord)) {
        tokens.push({
          type: 'operator',
          value: word,
          color: COLORS.operator
        })
      }
      // Check if item
      else if (ITEMS.includes(upperWord)) {
        tokens.push({
          type: 'item',
          value: word,
          color: COLORS.item
        })
      }
      // Unknown word - treat as text
      else {
        tokens.push({
          type: 'text',
          value: word,
          color: COLORS.text
        })
      }

      position += word.length
      continue
    }

    // Any other character
    tokens.push({
      type: 'text',
      value: input[position],
      color: COLORS.text
    })
    position++
  }

  return tokens
}

/**
 * Convert tokens to HTML with inline styles
 */
export function tokensToHtml(tokens: HighlightedToken[]): string {
  return tokens
    .map(token => `<span style="color: ${token.color}">${escapeHtml(token.value)}</span>`)
    .join('')
}

/**
 * Get highlighted HTML from input
 */
export function highlightToHtml(input: string): string {
  const tokens = highlight(input)
  return tokensToHtml(tokens)
}

function escapeHtml(text: string): string {
  const div = document.createElement('div')
  div.textContent = text
  return div.innerHTML
}
