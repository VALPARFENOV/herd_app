/**
 * HerdMaster Pro — Shared Contract Types
 *
 * Этот файл содержит типы контрактов между агентами.
 * Полные типы БД: apps/web/src/types/database.ts
 *
 * Правила:
 * - Добавляй новые типы при создании фичи (Product Agent)
 * - Backend Agent реализует, Frontend Agent использует
 * - Не дублируй — импортируй из database.ts где возможно
 */

// Re-export core types from database
// import { Database, ... } from '../apps/web/src/types/database'

// ============================================
// Enums / Union Types (shared across agents)
// ============================================

export type TenantTier = 'starter' | 'professional' | 'enterprise'
export type UserRole = 'owner' | 'manager' | 'veterinarian' | 'zootechnician' | 'accountant' | 'worker' | 'viewer'
export type AnimalStatus = 'heifer' | 'lactating' | 'dry' | 'fresh' | 'sold' | 'dead' | 'culled'
export type EventType = 'breeding' | 'calving' | 'heat' | 'pregnancy_check' | 'dry_off' | 'treatment' | 'vaccination' | 'bcs' | 'sold' | 'culled' | 'dead'

// RC Codes (DairyComp 305 standard)
// 0 = Heifer, 1 = Bred heifer, 2 = Fresh, 3 = Open/Lactating
// 4 = Bred/Lactating, 5 = Pregnant/Lactating, 6 = Dry
// 7 = Sold/Died, 8 = DNB (Do Not Breed)
export type RCCode = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8

// ============================================
// RPC Function Response Types
// ============================================

/** LIST command response */
export interface ListResult {
  data: Record<string, unknown>[]
  total: number
  fields: string[]
}

/** COUNT command response */
export interface CountResult {
  total: number
  breakdown?: Record<string, number>
}

/** BREDSUM response */
export interface BredsumResult {
  summary: {
    total_bred: number
    conception_rate: number
    heat_detection_rate: number
    pregnancy_rate: number
  }
  details: Record<string, unknown>[]
}

/** ECON response */
export interface EconResult {
  revenue: number
  costs: number
  iofc: number  // Income Over Feed Cost
  profit: number
  per_cow: {
    revenue: number
    costs: number
    iofc: number
  }
}

/** COWVAL response */
export interface CowvalResult {
  cow_id: string
  total_value: number
  production_value: number
  pregnancy_value: number
  genetic_value: number
  age_adjustment: number
}

/** PLOT response */
export interface PlotResult {
  series: {
    label: string
    data: { x: number; y: number }[]
  }[]
  x_label: string
  y_label: string
}

/** GRAPH (histogram) response */
export interface GraphHistogramResult {
  bins: { range: string; count: number }[]
  mean: number
  median: number
  std_dev: number
}

// ============================================
// Common API Patterns
// ============================================

/** Standard error response from PostgREST */
export interface ApiError {
  code: string
  message: string
  details: string | null
  hint: string | null
}

/** Paginated response wrapper */
export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  per_page: number
}

// ============================================
// Feature-specific types
// (Add new types here as features are developed)
// ============================================

// --- Example: New feature types go below ---
// export interface NewFeatureRequest { ... }
// export interface NewFeatureResponse { ... }
