'use client'

import { ReactNode, useRef } from 'react'
import { Toaster } from 'sonner'
import { CliResultsProvider, useCliResults } from './cli-results-provider'
import { SidebarHighlightProvider } from './sidebar-highlight-provider'
import { CliCommandProvider } from './cli-command-provider'
import { CommandResultsPanel } from './command-results-panel'
import { CliBar } from './cli-bar'

interface CliLayoutWrapperProps {
  children: ReactNode
}

function CliLayoutContent({ children }: { children: ReactNode }) {
  const { result, command, isVisible, hideResults } = useCliResults()
  const cliBarRef = useRef<{ insertCommand: (cmd: string) => void; focusCli: () => void } | null>(null)

  const handleInsertCommand = (cmd: string) => {
    if (cliBarRef.current) {
      cliBarRef.current.insertCommand(cmd)
      cliBarRef.current.focusCli()
    }
  }

  const handleFocusCli = () => {
    if (cliBarRef.current) {
      cliBarRef.current.focusCli()
    }
  }

  return (
    <CliCommandProvider insertCommand={handleInsertCommand} focusCli={handleFocusCli}>
      {children}
      <CommandResultsPanel
        result={result}
        command={command}
        isVisible={isVisible}
        onClose={hideResults}
      />
      <CliBar ref={cliBarRef} />
      <Toaster
        position="top-right"
        richColors
        closeButton
        theme="dark"
        toastOptions={{
          style: {
            background: 'rgb(17 24 39)',
            border: '1px solid rgb(55 65 81)',
            color: 'rgb(243 244 246)',
          },
        }}
      />
    </CliCommandProvider>
  )
}

export function CliLayoutWrapper({ children }: CliLayoutWrapperProps) {
  return (
    <SidebarHighlightProvider>
      <CliResultsProvider>
        <CliLayoutContent>{children}</CliLayoutContent>
      </CliResultsProvider>
    </SidebarHighlightProvider>
  )
}
