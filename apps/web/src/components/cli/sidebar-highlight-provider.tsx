'use client'

import { createContext, useContext, useState, ReactNode } from 'react'
import { SidebarSection } from '@/lib/cli/command-to-sidebar'

interface SidebarHighlightContextValue {
  highlightedSection: SidebarSection
  setHighlightedSection: (section: SidebarSection) => void
  clearHighlight: () => void
}

const SidebarHighlightContext = createContext<SidebarHighlightContextValue | undefined>(
  undefined
)

export function SidebarHighlightProvider({ children }: { children: ReactNode }) {
  const [highlightedSection, setHighlightedSection] = useState<SidebarSection>(null)

  const clearHighlight = () => setHighlightedSection(null)

  return (
    <SidebarHighlightContext.Provider
      value={{
        highlightedSection,
        setHighlightedSection,
        clearHighlight,
      }}
    >
      {children}
    </SidebarHighlightContext.Provider>
  )
}

export function useSidebarHighlight() {
  const context = useContext(SidebarHighlightContext)
  if (context === undefined) {
    throw new Error('useSidebarHighlight must be used within SidebarHighlightProvider')
  }
  return context
}
