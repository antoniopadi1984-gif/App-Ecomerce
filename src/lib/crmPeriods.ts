export type ViewMode = "daily" | "weekly" | "monthly" | "annual";

export type PeriodRow = {
    label: string;
    sublabel?: string;
    key: string;
    type: "day" | "week" | "month" | "year";
};

export function getWeeksInMonth(month: number, year: number): { start: string, end: string }[] {
    const weeks: { start: string, end: string }[] = [];
    const daysInMonth = new Date(year, month, 0).getDate();
    let currentStart = 1;

    while (currentStart <= daysInMonth) {
        let currentEnd = currentStart + 6;
        if (currentEnd > daysInMonth) {
            currentEnd = daysInMonth;
        }

        weeks.push({
            start: `D${currentStart}`,
            end: `D${currentEnd}`
        });

        currentStart = currentEnd + 1;
    }

    return weeks;
}

export type DayData = {
    day: number;
    facturacion: number;
    pedidos: number;
    entregados: number;
    incidencias: number;
    ticketMedio: number;
    margen: number;
};

export type WeekSummary = {
    label: string;
    dateRange: string;
    facturacion: number;
    pedidos: number;
    entregados: number;
    incidencias: number;
    ticketMedio: number;
    margen: number;
    varVsPrev: number | null;
};

function sum(arr: any[], key: string) {
    return arr.reduce((acc, obj) => acc + (obj[key] || 0), 0);
}

function avg(arr: any[], key: string) {
    if (arr.length === 0) return 0;
    return sum(arr, key) / arr.length;
}

export type MonthData = DayData & { month: number };

export type QuarterSummary = {
    label: string;
    dateRange: string;
    facturacion: number;
    pedidos: number;
    entregados: number;
    incidencias: number;
    ticketMedio: number;
    margen: number;
    varVsPrev: number | null;
};

function calcVariation(prev: number, curr: number) {
    if (prev === 0) return 0;
    return Math.round(((curr - prev) / prev) * 100);
}

export function getWeeksInMonthWithDays(month: number, year: number) {
    const weeks = [];
    const daysInMonth = new Date(year, month, 0).getDate();
    let currentStart = 1;

    const ms = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

    while (currentStart <= daysInMonth) {
        let currentEnd = currentStart + 6;
        if (currentEnd > daysInMonth) currentEnd = daysInMonth;

        weeks.push({
            startDay: currentStart,
            endDay: currentEnd,
            startFormatted: `${currentStart} ${ms[month - 1]}`,
            endFormatted: `${currentEnd} ${ms[month - 1]}`
        });

        currentStart = currentEnd + 1;
    }
    return weeks;
}

export function getWeeklySummary(dailyData: DayData[], month: number, year: number): WeekSummary[] {
    const weeks = getWeeksInMonthWithDays(month, year);
    return weeks.map((week, i) => {
        const weekDays = dailyData.filter(d => d.day >= week.startDay && d.day <= week.endDay);

        let prevFacturacion = 0;
        if (i > 0) {
            const prevWeekDays = dailyData.filter(d => d.day >= weeks[i - 1].startDay && d.day <= weeks[i - 1].endDay);
            prevFacturacion = sum(prevWeekDays, "facturacion");
        }

        const facturacion = sum(weekDays, "facturacion");

        return {
            label: `Semana ${i + 1}`,
            dateRange: `${week.startFormatted} - ${week.endFormatted}`,
            facturacion: facturacion,
            pedidos: sum(weekDays, "pedidos"),
            entregados: sum(weekDays, "entregados"),
            incidencias: sum(weekDays, "incidencias"),
            ticketMedio: Math.round(avg(weekDays, "ticketMedio")),
            margen: Math.round(avg(weekDays, "margen")),
            varVsPrev: i > 0 ? calcVariation(prevFacturacion, facturacion) : null
        };
    });
}

function calcVariationVsPrevQuarter(q: { label: string, months: number[], name: string }, allMonths: MonthData[], qIndex: number) {
    if (qIndex === 0) return null; // Q1 doesn't have prev Q in same year

    const currentQData = allMonths.filter(m => q.months.includes(m.month));
    const currentFact = sum(currentQData, "facturacion");

    // prev Q logic manually mappings: Q2 -> Q1, Q3 -> Q2, Q4 -> Q3
    let prevMonths: number[] = [];
    if (q.label === "Q2") prevMonths = [0, 1, 2];
    if (q.label === "Q3") prevMonths = [3, 4, 5];
    if (q.label === "Q4") prevMonths = [6, 7, 8];

    const prevQData = allMonths.filter(m => prevMonths.includes(m.month));
    const prevFact = sum(prevQData, "facturacion");

    return calcVariation(prevFact, currentFact);
}

export function getQuarterlySummary(monthlyData: MonthData[]): QuarterSummary[] {
    return [
        { label: "Q1", months: [0, 1, 2], name: "Ene-Mar" },
        { label: "Q2", months: [3, 4, 5], name: "Abr-Jun" },
        { label: "Q3", months: [6, 7, 8], name: "Jul-Sep" },
        { label: "Q4", months: [9, 10, 11], name: "Oct-Dic" }
    ].map((q, i) => {
        const qMonths = monthlyData.filter(m => q.months.includes(m.month));
        return {
            label: q.label,
            dateRange: q.name,
            facturacion: sum(qMonths, "facturacion"),
            pedidos: sum(qMonths, "pedidos"),
            entregados: sum(qMonths, "entregados"),
            incidencias: sum(qMonths, "incidencias"),
            ticketMedio: Math.round(avg(qMonths, "ticketMedio")),
            margen: Math.round(avg(qMonths, "margen")),
            varVsPrev: calcVariationVsPrevQuarter(q, monthlyData, i)
        }
    });
}

export function generateRows(viewMode: ViewMode, month: number, year: number): PeriodRow[] {
    switch (viewMode) {

        case "daily":
            // Una fila por día del mes seleccionado
            // Día 1, Día 2... Día 28/29/30/31
            const daysInMonth = new Date(year, month, 0).getDate()
            return Array.from({ length: daysInMonth }, (_, i) => ({
                label: `Día ${i + 1}`,
                key: `${year}-${month}-${i + 1}`,
                type: "day"
            }))

        case "weekly":
            // Una fila por semana del mes seleccionado
            // Sem 1 (D1-D7), Sem 2 (D8-D14), Sem 3 (D15-D21), Sem 4 (D22-D28), Sem 5 (D29-D31)
            return getWeeksInMonth(month, year).map((week, i) => ({
                label: `Sem ${i + 1}`,
                sublabel: `${week.start} - ${week.end}`,
                key: `week-${i + 1}`,
                type: "week"
            }))

        case "monthly":
            // Una fila por mes del año seleccionado
            // Enero, Febrero... Diciembre
            return Array.from({ length: 12 }, (_, i) => ({
                label: new Date(year, i, 1).toLocaleString("es-ES", { month: "long" }),
                key: `${year}-${i + 1}`,
                type: "month"
            }))

        case "annual":
            // Una fila por año — últimos 3 años + año actual
            return [year - 3, year - 2, year - 1, year].map(y => ({
                label: `${y}`,
                key: `${y}`,
                type: "year"
            }))

        default:
            return [];
    }
}
