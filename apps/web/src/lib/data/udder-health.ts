import { createClient } from '@/lib/supabase/server'

/**
 * Udder quarter test result
 */
export interface UdderQuarterTest {
  id: string
  animalId: string
  testDate: string
  testType: 'scc' | 'cmt' | 'culture' | 'pcr'
  quarter: 'LF' | 'LR' | 'RF' | 'RR' // Left/Right Front/Rear
  resultValue: number | null // Numeric result (e.g., SCC count)
  resultText: string | null // Text result (e.g., CMT score: '-', '+', '++', '+++')
  resultInterpretation: string | null // 'normal', 'subclinical', 'clinical', 'infected'
  pathogen: string | null // e.g., 'S. aureus', 'Strep. uberis', 'E. coli'
  colonyCount: string | null
  antibioticSensitivity: Record<string, string> | null // {"penicillin": "S", "ceftiofur": "R"}
  notes: string | null
}

/**
 * Udder test session (all 4 quarters tested on same date)
 */
export interface UdderTestSession {
  testDate: string
  testType: 'scc' | 'cmt' | 'culture' | 'pcr'
  quarters: {
    LF: UdderQuarterTest | null
    LR: UdderQuarterTest | null
    RF: UdderQuarterTest | null
    RR: UdderQuarterTest | null
  }
  avgSCC: number | null
  infectedQuarters: number
}

/**
 * Get all udder tests for an animal
 */
export async function getUdderTests(animalId: string): Promise<UdderQuarterTest[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('udder_quarter_tests')
    .select('*')
    .eq('animal_id', animalId)
    .order('test_date', { ascending: false })
    .order('quarter', { ascending: true })

  if (error) {
    console.error('Error fetching udder tests:', error)
    return []
  }

  if (!data || data.length === 0) {
    return []
  }

  return data.map((test: any) => ({
    id: test.id,
    animalId: test.animal_id,
    testDate: test.test_date,
    testType: test.test_type,
    quarter: test.quarter,
    resultValue: test.result_value,
    resultText: test.result_text,
    resultInterpretation: test.result_interpretation,
    pathogen: test.pathogen,
    colonyCount: test.colony_count,
    antibioticSensitivity: test.antibiotic_sensitivity as Record<string, string> | null,
    notes: test.notes,
  }))
}

/**
 * Get udder tests grouped by session (date + type)
 */
export async function getUdderTestSessions(animalId: string): Promise<UdderTestSession[]> {
  const tests = await getUdderTests(animalId)

  if (tests.length === 0) {
    return []
  }

  // Group by date and test type
  const sessionMap = new Map<string, UdderQuarterTest[]>()

  tests.forEach((test) => {
    const key = `${test.testDate}-${test.testType}`
    const sessionTests = sessionMap.get(key) || []
    sessionTests.push(test)
    sessionMap.set(key, sessionTests)
  })

  // Convert to sessions
  const sessions: UdderTestSession[] = []

  sessionMap.forEach((testsInSession, key) => {
    const [testDate, testType] = key.split('-')

    const quarters = {
      LF: testsInSession.find((t) => t.quarter === 'LF') || null,
      LR: testsInSession.find((t) => t.quarter === 'LR') || null,
      RF: testsInSession.find((t) => t.quarter === 'RF') || null,
      RR: testsInSession.find((t) => t.quarter === 'RR') || null,
    }

    // Calculate average SCC if test type is scc
    let avgSCC: number | null = null
    if (testType === 'scc') {
      const sccValues = testsInSession
        .map((t) => t.resultValue)
        .filter((v): v is number => v !== null)
      if (sccValues.length > 0) {
        avgSCC = Math.round(sccValues.reduce((sum, v) => sum + v, 0) / sccValues.length)
      }
    }

    // Count infected quarters (culture with pathogen or high SCC)
    const infectedQuarters = testsInSession.filter(
      (t) =>
        t.pathogen !== null ||
        (t.resultValue !== null && t.resultValue > 200000) ||
        t.resultInterpretation === 'infected' ||
        t.resultInterpretation === 'clinical'
    ).length

    sessions.push({
      testDate,
      testType: testType as 'scc' | 'cmt' | 'culture' | 'pcr',
      quarters,
      avgSCC,
      infectedQuarters,
    })
  })

  return sessions.sort((a, b) => b.testDate.localeCompare(a.testDate))
}

/**
 * Get latest SCC test for an animal
 */
export async function getLatestSCCTest(animalId: string): Promise<UdderTestSession | null> {
  const sessions = await getUdderTestSessions(animalId)
  const sccSession = sessions.find((s) => s.testType === 'scc')
  return sccSession || null
}

/**
 * Get udder health statistics for the herd
 */
export async function getUdderHealthStats(tenantId?: string): Promise<{
  totalTests: number
  cowsWithHighSCC: number // SCC > 200K
  cowsWithMastitis: number // SCC > 400K or culture positive
  avgHerdSCC: number
}> {
  const supabase = await createClient()

  // Get latest SCC tests per animal
  const { data } = await (supabase
    .from('udder_quarter_tests')
    .select('animal_id, test_date, result_value, pathogen')
    .eq('test_type', 'scc')
    .order('test_date', { ascending: false }) as any)

  if (!data || data.length === 0) {
    return {
      totalTests: 0,
      cowsWithHighSCC: 0,
      cowsWithMastitis: 0,
      avgHerdSCC: 0,
    }
  }

  // Get latest test per animal
  const latestPerAnimal = new Map<string, { resultValue: number | null; pathogen: string | null }>()

  data.forEach((test: any) => {
    if (!latestPerAnimal.has(test.animal_id)) {
      latestPerAnimal.set(test.animal_id, {
        resultValue: test.result_value,
        pathogen: test.pathogen,
      })
    }
  })

  let cowsWithHighSCC = 0
  let cowsWithMastitis = 0
  let totalSCC = 0
  let cowsWithSCC = 0

  latestPerAnimal.forEach((test) => {
    if (test.resultValue !== null) {
      totalSCC += test.resultValue
      cowsWithSCC++

      if (test.resultValue > 200000) {
        cowsWithHighSCC++
      }

      if (test.resultValue > 400000 || test.pathogen !== null) {
        cowsWithMastitis++
      }
    }
  })

  return {
    totalTests: data.length,
    cowsWithHighSCC,
    cowsWithMastitis,
    avgHerdSCC: cowsWithSCC > 0 ? Math.round(totalSCC / cowsWithSCC) : 0,
  }
}

/**
 * Common pathogens for dropdowns
 */
export const COMMON_PATHOGENS = [
  { code: 'S_AUREUS', name: 'Staphylococcus aureus (contagious)' },
  { code: 'STREP_AG', name: 'Streptococcus agalactiae (contagious)' },
  { code: 'STREP_UB', name: 'Streptococcus uberis (environmental)' },
  { code: 'STREP_DYS', name: 'Streptococcus dysgalactiae (environmental)' },
  { code: 'E_COLI', name: 'Escherichia coli (environmental)' },
  { code: 'KLEB', name: 'Klebsiella spp. (environmental)' },
  { code: 'CNS', name: 'Coagulase-negative Staph (minor)' },
  { code: 'CORYNE', name: 'Corynebacterium bovis (minor)' },
  { code: 'YEAST', name: 'Yeast/Fungi' },
  { code: 'MIXED', name: 'Mixed culture' },
  { code: 'NO_GROWTH', name: 'No growth' },
] as const

/**
 * SCC interpretation thresholds
 */
export const SCC_THRESHOLDS = {
  NORMAL: 100000, // < 100K = healthy
  SUBCLINICAL: 200000, // 100-200K = watch
  CLINICAL: 400000, // > 400K = clinical mastitis
} as const

/**
 * CMT scores
 */
export const CMT_SCORES = [
  { score: '-', name: 'Negative', description: 'No mastitis' },
  { score: 'T', name: 'Trace', description: 'Slight reaction' },
  { score: '+', name: 'Weak positive', description: 'Mild mastitis' },
  { score: '++', name: 'Distinct positive', description: 'Moderate mastitis' },
  { score: '+++', name: 'Strong positive', description: 'Severe mastitis' },
] as const
