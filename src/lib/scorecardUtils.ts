export const METRICS_WITH_TARGET = ["facturacion", "pedidos", "roas", "cpa", "ratio_acierto", "tasa_envio", "tasa_entrega"]
export const LOWER_IS_BETTER = ["cpa", "coste_visita", "tasa_rebote", "cogs", "shipping_total"]

export const TARGET_FIELD_MAP: Record<string, string> = {
  facturacion: "facturacion",
  inversion: "adSpendBudget",
  roas: "targetRoas",
  cpa: "maxCpa",
  coste_visita: "maxCpc",
  margen: "targetProfitMargin"
}

export function getStatus(value: number, target: number, metricId: string): "green" | "yellow" | "red" | "neutral" {
  if (!target || !value) return "neutral"
  const isLowerBetter = LOWER_IS_BETTER.includes(metricId)
  const ratio = isLowerBetter ? target / value : value / target
  if (ratio >= 0.95) return "green"
  if (ratio >= 0.8) return "yellow"
  return "red"
}

export function getObjPct(acum: number, target: number): number | null {
  if (!target || target === 0) return null
  return Math.round((acum / target) * 100)
}

export function getProjection(weeklyValues: number[], currentWeek: number, totalWeeks: number): number {
  const withData = weeklyValues.filter(v => v > 0)
  if (withData.length === 0) return 0
  const recentAvg = withData.slice(-2).reduce((a, b) => a + b, 0) / Math.min(2, withData.length)
  const acum = withData.reduce((a, b) => a + b, 0)
  const projection = acum + recentAvg * (totalWeeks - currentWeek)
  return Math.round(projection)
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
  if (!target) return true
  const progress = currentWeek / totalWeeks
  const targetAtPoint = target * progress
  return acum >= targetAtPoint
}

export function getVariation(current: number, previous: number): number | null {
  if (!previous || previous === 0) return null
  return Math.round(((current - previous) / previous) * 100)
}

export function formatValue(value: number, unit: string): string {
  if (value === null || value === undefined) return "—"
  const formatted = Math.round(value).toLocaleString("es-ES")
  if (unit === "EUR") return `${formatted}€`
  if (unit === "%") return `${value.toFixed(1)}%`
  if (unit === "x") return `${value.toFixed(2)}x`
  return formatted
}
