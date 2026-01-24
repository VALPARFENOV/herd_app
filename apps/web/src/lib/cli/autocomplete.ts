/**
 * Autocomplete engine for DairyComp commands using Fuse.js
 * Provides context-aware suggestions based on cursor position
 */

import Fuse from 'fuse.js'
import { getAllItemCodes, getItemInfo, RC_VALUES, VC_VALUES } from './field-mapping'

export interface Suggestion {
  type: 'command' | 'item' | 'operator' | 'value' | 'template'
  value: string
  label: string
  description?: string
  score?: number
}

/**
 * Command keywords
 */
const COMMANDS: Suggestion[] = [
  { type: 'command', value: 'LIST', label: 'LIST', description: 'Display animal data in columns' },
  { type: 'command', value: 'SHOW', label: 'SHOW', description: 'Display animal data (alias for LIST)' },
  { type: 'command', value: 'SUM', label: 'SUM', description: 'Sum numeric values' },
  { type: 'command', value: 'COUNT', label: 'COUNT', description: 'Count animals' },
  { type: 'command', value: 'PCT', label: 'PCT', description: 'Calculate percentages' },
  { type: 'command', value: 'GRAPH', label: 'GRAPH', description: 'Display horizontal bar graph' },
  { type: 'command', value: 'PLOT', label: 'PLOT', description: 'Display scatter plot' },
  { type: 'command', value: 'EVENTS', label: 'EVENTS', description: 'List events for animals' },
  { type: 'command', value: 'BREDSUM', label: 'BREDSUM', description: 'Breeding summary report' },
]

/**
 * Operator keywords
 */
const OPERATORS: Suggestion[] = [
  { type: 'operator', value: 'FOR', label: 'FOR', description: 'Filter condition' },
  { type: 'operator', value: 'BY', label: 'BY', description: 'Sort ascending' },
  { type: 'operator', value: 'DOWNBY', label: 'DOWNBY', description: 'Sort descending' },
]

/**
 * Common command templates
 */
const TEMPLATES: Suggestion[] = [
  { type: 'template', value: 'LIST ID PEN LACT DIM RC', label: 'LIST ID PEN LACT DIM RC', description: 'Basic animal list' },
  { type: 'template', value: 'LIST ID FOR RC=5', label: 'LIST ID FOR RC=5', description: 'List pregnant cows' },
  { type: 'template', value: 'LIST ID FOR RC=3 DIM>60', label: 'LIST ID FOR RC=3 DIM>60', description: 'Cows ready to breed' },
  { type: 'template', value: 'LIST ID MILK SCC FOR SCC>200', label: 'LIST ID MILK SCC FOR SCC>200', description: 'High SCC cows' },
  { type: 'template', value: 'SUM MILK BY PEN', label: 'SUM MILK BY PEN', description: 'Total milk by pen' },
  { type: 'template', value: 'COUNT FOR RC=5 BY PEN', label: 'COUNT FOR RC=5 BY PEN', description: 'Pregnant cows per pen' },
]

/**
 * Get item suggestions from field mappings
 */
function getItemSuggestions(): Suggestion[] {
  const itemCodes = getAllItemCodes()
  return itemCodes.map(code => {
    const info = getItemInfo(code)
    return {
      type: 'item' as const,
      value: code,
      label: code,
      description: info?.description || ''
    }
  })
}

/**
 * Get RC value suggestions
 */
function getRcSuggestions(): Suggestion[] {
  return Object.entries(RC_VALUES).map(([value, info]) => ({
    type: 'value' as const,
    value: `RC=${value}`,
    label: `RC=${value}`,
    description: `${info.label}: ${info.description}`
  }))
}

/**
 * Get VC value suggestions
 */
function getVcSuggestions(): Suggestion[] {
  return Object.entries(VC_VALUES).map(([value, info]) => ({
    type: 'value' as const,
    value: `VC=${value}`,
    label: `VC=${value}`,
    description: `${info.label}: ${info.description}`
  }))
}

/**
 * Autocomplete engine
 */
export class AutocompleteEngine {
  private commandFuse: Fuse<Suggestion>
  private itemFuse: Fuse<Suggestion>
  private templateFuse: Fuse<Suggestion>

  constructor() {
    const fuseOptions = {
      keys: ['value', 'label', 'description'],
      threshold: 0.3,
      includeScore: true,
    }

    this.commandFuse = new Fuse([...COMMANDS, ...OPERATORS], fuseOptions)
    this.itemFuse = new Fuse(getItemSuggestions(), fuseOptions)
    this.templateFuse = new Fuse(TEMPLATES, fuseOptions)
  }

  /**
   * Get suggestions based on current input and cursor position
   */
  getSuggestions(input: string, cursorPosition: number): Suggestion[] {
    if (!input || cursorPosition === 0) {
      // At start - suggest commands or templates
      return [
        ...COMMANDS.slice(0, 5),
        ...TEMPLATES.slice(0, 3)
      ]
    }

    const beforeCursor = input.slice(0, cursorPosition)
    const lastWord = this.getLastWord(beforeCursor)

    if (!lastWord) {
      return []
    }

    // Determine context
    const context = this.getContext(beforeCursor)

    switch (context) {
      case 'command':
        return this.searchCommands(lastWord)

      case 'item':
        return this.searchItems(lastWord)

      case 'operator':
        return this.searchOperators(lastWord)

      case 'value':
        return this.searchValues(beforeCursor, lastWord)

      default:
        // General search across all types
        return this.searchAll(lastWord)
    }
  }

  /**
   * Determine context based on input before cursor
   */
  private getContext(beforeCursor: string): 'command' | 'item' | 'operator' | 'value' | 'general' {
    const upper = beforeCursor.toUpperCase()

    // At start - command context
    if (!upper.match(/\s/)) {
      return 'command'
    }

    // After FOR - expecting field or value
    if (upper.match(/\sFOR\s+\w*$/i)) {
      return 'value'
    }

    // After BY or DOWNBY - expecting field
    if (upper.match(/\s(DOWN)?BY\s+\w*$/i)) {
      return 'item'
    }

    // After command and before FOR/BY - expecting items
    if (upper.match(/^(LIST|SHOW|SUM|COUNT|PCT)\s+/) && !upper.match(/\s(FOR|BY|DOWNBY)\s/)) {
      return 'item'
    }

    // After comparison operator - general
    if (upper.match(/[=<>]+$/)) {
      return 'value'
    }

    return 'general'
  }

  /**
   * Get last word before cursor
   */
  private getLastWord(text: string): string {
    const match = text.match(/([A-Z0-9]+)$/i)
    return match ? match[1] : ''
  }

  /**
   * Search commands
   */
  private searchCommands(query: string): Suggestion[] {
    if (!query) return COMMANDS.slice(0, 5)

    const results = this.commandFuse.search(query)
    return results.slice(0, 5).map(r => ({
      ...r.item,
      score: r.score
    }))
  }

  /**
   * Search items
   */
  private searchItems(query: string): Suggestion[] {
    if (!query) return getItemSuggestions().slice(0, 10)

    const results = this.itemFuse.search(query)
    return results.slice(0, 10).map(r => ({
      ...r.item,
      score: r.score
    }))
  }

  /**
   * Search operators
   */
  private searchOperators(query: string): Suggestion[] {
    if (!query) return OPERATORS

    return OPERATORS.filter(op =>
      op.value.toLowerCase().startsWith(query.toLowerCase())
    )
  }

  /**
   * Search values (RC, VC, etc.)
   */
  private searchValues(beforeCursor: string, query: string): Suggestion[] {
    const upper = beforeCursor.toUpperCase()

    // If typing RC= or RC value
    if (upper.match(/\bRC\s*=?\s*\d*$/)) {
      return getRcSuggestions()
    }

    // If typing VC= or VC value
    if (upper.match(/\bVC\s*=?\s*\d*$/)) {
      return getVcSuggestions()
    }

    // Otherwise suggest field names
    return this.searchItems(query)
  }

  /**
   * Search all suggestion types
   */
  private searchAll(query: string): Suggestion[] {
    const commandResults = this.commandFuse.search(query).slice(0, 2)
    const itemResults = this.itemFuse.search(query).slice(0, 5)
    const templateResults = this.templateFuse.search(query).slice(0, 2)

    return [
      ...commandResults.map(r => ({ ...r.item, score: r.score })),
      ...itemResults.map(r => ({ ...r.item, score: r.score })),
      ...templateResults.map(r => ({ ...r.item, score: r.score })),
    ].sort((a, b) => (a.score || 0) - (b.score || 0))
  }

  /**
   * Get completion text for a suggestion
   * Replaces the last word with the suggestion value
   */
  getCompletionText(input: string, cursorPosition: number, suggestion: Suggestion): {
    newText: string
    newCursorPosition: number
  } {
    const beforeCursor = input.slice(0, cursorPosition)
    const afterCursor = input.slice(cursorPosition)

    const lastWordMatch = beforeCursor.match(/([A-Z0-9=<>]*)$/i)

    if (!lastWordMatch) {
      // No match - append suggestion
      return {
        newText: beforeCursor + suggestion.value + ' ' + afterCursor,
        newCursorPosition: (beforeCursor + suggestion.value + ' ').length
      }
    }

    const lastWordStart = beforeCursor.length - lastWordMatch[1].length
    const newBeforeCursor = beforeCursor.slice(0, lastWordStart) + suggestion.value + ' '

    return {
      newText: newBeforeCursor + afterCursor,
      newCursorPosition: newBeforeCursor.length
    }
  }
}

/**
 * Singleton instance
 */
let autocompleteEngine: AutocompleteEngine | null = null

export function getAutocompleteEngine(): AutocompleteEngine {
  if (!autocompleteEngine) {
    autocompleteEngine = new AutocompleteEngine()
  }
  return autocompleteEngine
}
