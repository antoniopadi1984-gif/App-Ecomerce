export function projectEndOfMonth(
    weeklyValues: number[],
    currentWeek: number,
    totalWeeks: number,
    acum: number
): number {
    if (currentWeek >= totalWeeks) return acum;

    const validWeeks = weeklyValues.slice(0, currentWeek).filter(v => typeof v === 'number' && !isNaN(v));
    if (validWeeks.length === 0) return acum;

    // Average of last 2 weeks (or just 1 if only 1 is available)
    const recentWeeks = validWeeks.slice(-2);
    const recentAvg = recentWeeks.reduce((a, b) => a + b, 0) / recentWeeks.length;

    const remainingWeeks = totalWeeks - currentWeek;
    const projection = acum + (recentAvg * remainingWeeks);
    return Math.round(projection);
}
