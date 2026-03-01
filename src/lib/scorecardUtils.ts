export const METRICS_WITH_TARGET = ["facturacion", "pedidos", "roas", "cpa", "tasa_envio", "ratio_acierto", "tasa_entrega"]
export const LOWER_IS_BETTER = ["cpa"]

export function getStatus(value: number, target: number, metricId: string): "green" | "yellow" | "red" | "neutral" {
  if (!target || !value) return "neutral"
  const ratio = LOWER_IS_BETTER.includes(metricId) ? target / value : value / target
  if (ratio >= 0.9) return "green"
  if (ratio >= 0.7) return "yellow"
  return "red"
}

export function getObjPct(acum: number, target: number): number | null {
  if (!target) return null
  return Math.round((acum / target) * 100)
}

export function getProjection(weeklyValues: number[], currentWeek: number, totalWeeks: number): number {
  const withData = weeklyValues.filter(v => v > 0)
  if (withData.length === 0) return 0
  const recentAvg = withData.slice(-2).reduce((a, b) => a + b, 0) / Math.min(2, withData.length)
  const acum = withData.reduce((a, b) => a + b, 0)
  return Math.round(acum + recentAvg * (totalWeeks - currentWeek))
}

export function getNeededPerWeek(acum: number, target: number, currentWeek: number, totalWeeks: number): number | null {
  if (!target) return null
  const weeksRemaining = totalWeeks - currentWeek
  if (weeksRemaining <= 0) return null
  const remaining = target - acum
  if (remaining <= 0) return 0
  return Math.round(remaining / weeksRemaining)
}

export function isOnTrack(acum: number, target: number, currentWeek: number, totalWeeks: number): boolean {
  const currentPace = currentWeek > 0 ? acum / currentWeek : 0
  const needed = getNeededPerWeek(acum, target, currentWeek, totalWeeks)
  if (needed === null || needed === 0) return true
  return currentPace >= needed
}

export function getVariation(current: number, previous: number): number | null {
  if (!previous || previous === 0) return null
  return Math.round(((current - previous) / previous) * 100)
}

export function formatValue(value: number, unit: string): string {
  if (unit === "EUR") return `€${value.toLocaleString("es-ES")}`
  if (unit === "%") return `${value}%`
  if (unit === "x") return `${value}x`
  return `${value.toLocaleString("es-ES")}`
}
