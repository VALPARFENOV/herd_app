'use client'

import { useState } from 'react'
import { ExecutionResult } from '@/lib/cli/executor'
import { CommandResultTable } from './command-result-table'
import { Loader2, AlertCircle, CheckCircle2, X } from 'lucide-react'

interface CommandResultsPanelProps {
  result: ExecutionResult | null
  command: string | null
  isVisible: boolean
  onClose: () => void
}

export function CommandResultsPanel({
  result,
  command,
  isVisible,
  onClose
}: CommandResultsPanelProps) {
  if (!isVisible || !result) {
    return null
  }

  return (
    <div className="fixed inset-x-0 top-16 z-40 mx-auto max-w-7xl px-4 lg:pl-64">
      <div className="rounded-lg border border-gray-700 bg-gray-900/95 shadow-2xl backdrop-blur-sm">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-700 px-6 py-4">
          <div className="flex items-center gap-3">
            {result.success ? (
              <CheckCircle2 className="h-5 w-5 text-green-500" />
            ) : (
              <AlertCircle className="h-5 w-5 text-red-500" />
            )}
            <div>
              <div className="font-mono text-sm font-medium text-gray-100">
                {command}
              </div>
              <div className="mt-0.5 text-xs text-gray-400">
                {result.success ? (
                  <>
                    {result.count !== undefined && `${result.count} results`}
                    {result.executionTime && ` • ${result.executionTime}ms`}
                  </>
                ) : (
                  <span className="text-red-400">Execution failed</span>
                )}
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="rounded p-1 text-gray-400 hover:bg-gray-800 hover:text-gray-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="max-h-[calc(100vh-300px)] overflow-auto p-6">
          {result.success ? (
            <>
              {result.type === 'list' && result.data && result.columns && (
                <CommandResultTable
                  data={result.data}
                  columns={result.columns}
                />
              )}

              {result.type === 'count' && result.count !== undefined && (
                <div className="flex items-center justify-center py-12">
                  <div className="text-center">
                    <div className="text-6xl font-bold text-gray-100">
                      {result.count}
                    </div>
                    <div className="mt-2 text-sm text-gray-400">
                      animals matched
                    </div>
                  </div>
                </div>
              )}

              {result.type === 'sum' && result.aggregates && (
                <div className="space-y-4">
                  {Object.entries(result.aggregates).map(([key, value]) => (
                    <div
                      key={key}
                      className="flex items-center justify-between rounded-lg border border-gray-700 bg-gray-800 px-6 py-4"
                    >
                      <span className="text-sm font-medium text-gray-400">
                        {key}
                      </span>
                      <span className="text-2xl font-bold text-gray-100">
                        {typeof value === 'number' ? value.toLocaleString() : value}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {result.data && result.data.length === 0 && (
                <div className="flex items-center justify-center py-12 text-center">
                  <div>
                    <AlertCircle className="mx-auto h-12 w-12 text-gray-600" />
                    <div className="mt-4 text-sm text-gray-400">
                      No results found
                    </div>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="rounded-lg border border-red-900/50 bg-red-950/20 px-6 py-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-500" />
                <div>
                  <div className="text-sm font-medium text-red-400">
                    Error executing command
                  </div>
                  <div className="mt-1 text-sm text-red-300/80">
                    {result.error || 'Unknown error occurred'}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
