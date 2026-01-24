'use client'

import { createContext, useContext, useState, ReactNode } from 'react'
import { ExecutionResult } from '@/lib/cli/executor'

interface CliResultsContextValue {
  result: ExecutionResult | null
  command: string | null
  isVisible: boolean
  setResult: (result: ExecutionResult | null, command: string | null) => void
  showResults: () => void
  hideResults: () => void
}

const CliResultsContext = createContext<CliResultsContextValue | undefined>(undefined)

export function CliResultsProvider({ children }: { children: ReactNode }) {
  const [result, setResultState] = useState<ExecutionResult | null>(null)
  const [command, setCommand] = useState<string | null>(null)
  const [isVisible, setIsVisible] = useState(false)

  const setResult = (newResult: ExecutionResult | null, newCommand: string | null) => {
    setResultState(newResult)
    setCommand(newCommand)
    if (newResult) {
      setIsVisible(true)
    }
  }

  const showResults = () => setIsVisible(true)
  const hideResults = () => setIsVisible(false)

  return (
    <CliResultsContext.Provider
      value={{
        result,
        command,
        isVisible,
        setResult,
        showResults,
        hideResults
      }}
    >
      {children}
    </CliResultsContext.Provider>
  )
}

export function useCliResults() {
  const context = useContext(CliResultsContext)
  if (context === undefined) {
    throw new Error('useCliResults must be used within CliResultsProvider')
  }
  return context
}
