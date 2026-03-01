export interface ScorecardRow {
    label: string;
    target?: number | null;
    acum: number;
    sem1: number;
    sem2: number;
    sem3: number;
    sem4: number;
}

export interface Alert {
    metric: string;
    type: "downtrend" | "off_target";
    severity: "warning" | "critical";
    message: string;
}

export function checkTrendAlerts(rows: ScorecardRow[]): Alert[] {
    const alerts: Alert[] = [];

    rows.forEach(row => {
        const values = [row.sem1, row.sem2, row.sem3, row.sem4].filter(v => v !== undefined && v !== null && !isNaN(v) && v > 0);
        if (values.length < 2) return;

        // Caída 2 semanas seguidas
        const last2 = values.slice(-2);
        if (last2[1] < last2[0]) {
            const isSecondDrop = values.length >= 3 && values[values.length - 2] < values[values.length - 3];
            if (isSecondDrop) {
                alerts.push({
                    metric: row.label,
                    type: "downtrend",
                    severity: "warning",
                    message: `${row.label} lleva 2 semanas consecutivas bajando`
                });
            }
        }

        // Métrica en RED con target definido
        if (row.target && row.acum / row.target < 0.7) {
            alerts.push({
                metric: row.label,
                type: "off_target",
                severity: "critical",
                message: `${row.label} está al ${Math.round((row.acum / row.target) * 100)}% del objetivo`
            });
        }
    });

    return alerts;
}
