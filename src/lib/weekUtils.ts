import { getISOWeek, endOfMonth, startOfMonth, getDaysInMonth } from "date-fns";

export interface WeekRange {
    sem: number;
    from: string;
    to: string;
}

export function getWeeksInMonth(month: number, year: number): number {
    const firstDay = new Date(year, month - 1, 1);
    const lastDay = new Date(year, month, 0);

    // Calculate ISO weeks
    // Handle edge cases around year ends (ISO dates can jump to next/prev year weeks)
    let firstWeek = getISOWeek(firstDay);
    let lastWeek = getISOWeek(lastDay);

    // Correction for December edge cases where last days might fall into week 1 of next year
    if (lastWeek === 1 && month === 12) {
        lastWeek = 53; // Simplification, handle properly if needed, usually months span 4-5 weeks.
    }

    const weeks = Math.max(1, lastWeek - firstWeek + 1);
    return weeks > 4 ? 5 : 4;  // Max 5 weeks
}

export function getWeekRanges(month: number, year: number): WeekRange[] {
    const numWeeks = getWeeksInMonth(month, year);
    const ranges: WeekRange[] = [];
    const daysInMonth = getDaysInMonth(new Date(year, month - 1, 1));

    // Simplification for UI display
    let currentDay = 1;
    for (let i = 1; i <= numWeeks; i++) {
        const fromDate = currentDay;
        let toDate = currentDay + 6;
        if (i === numWeeks || toDate > daysInMonth) {
            toDate = daysInMonth;
        }

        ranges.push({
            sem: i,
            from: `${fromDate} ${new Date(year, month - 1, 1).toLocaleString('es', { month: 'short' })}`,
            to: `${toDate} ${new Date(year, month - 1, 1).toLocaleString('es', { month: 'short' })}`
        });
        currentDay = toDate + 1;
    }
    return ranges;
}
