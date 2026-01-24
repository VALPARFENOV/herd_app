interface MilkProductionData {
  date: string
  total_kg: number
  avg_per_cow: number
}

// Helper to generate sample data for demo
export function generateSampleMilkProductionData(
  days: number = 30,
  milkingCows: number = 100
): MilkProductionData[] {
  const data: MilkProductionData[] = []
  const today = new Date()

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today)
    date.setDate(date.getDate() - i)

    // Base production with some weekly variation (lower on weekends)
    const dayOfWeek = date.getDay()
    const weekendFactor = dayOfWeek === 0 || dayOfWeek === 6 ? 0.95 : 1

    // Seasonal variation (summer peak)
    const month = date.getMonth()
    const seasonalFactor = 1 + 0.1 * Math.sin((month - 3) * Math.PI / 6)

    // Random daily variation
    const randomFactor = 0.95 + Math.random() * 0.1

    const avgPerCow = 32 * weekendFactor * seasonalFactor * randomFactor
    const total_kg = Math.round(avgPerCow * milkingCows)

    data.push({
      date: date.toISOString().split("T")[0],
      total_kg,
      avg_per_cow: Math.round(avgPerCow * 10) / 10,
    })
  }

  return data
}
