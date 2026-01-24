'use client'

import { createContext, useContext, ReactNode } from 'react'

interface CliCommandContextValue {
  insertCommand: (command: string) => void
  focusCli: () => void
}

const CliCommandContext = createContext<CliCommandContextValue | undefined>(undefined)

export function CliCommandProvider({
  children,
  insertCommand,
  focusCli,
}: {
  children: ReactNode
  insertCommand: (command: string) => void
  focusCli: () => void
}) {
  return (
    <CliCommandContext.Provider value={{ insertCommand, focusCli }}>
      {children}
    </CliCommandContext.Provider>
  )
}

export function useCliCommand() {
  const context = useContext(CliCommandContext)
  if (context === undefined) {
    throw new Error('useCliCommand must be used within CliCommandProvider')
  }
  return context
}
