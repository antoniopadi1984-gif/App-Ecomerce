export interface AlertRule {
    id: string;
    scope: string;
    field: string;
    operator: string;
    threshold: number;
    label: string;
    enabled: boolean;
}

export interface ActiveAlert {
    type: "DANGER" | "WARNING" | "INFO";
    label: string;
    description: string;
}

export function evaluateAlerts(metrics: Record<string, any>, rules: AlertRule[]): ActiveAlert[] {
    const activeAlerts: ActiveAlert[] = [];

    const activeRules = rules.filter(r => r.enabled);

    for (const rule of activeRules) {
        const value = metrics[rule.field];
        if (value === undefined || value === null) continue;

        let triggered = false;
        switch (rule.operator) {
            case "GT": triggered = value > rule.threshold; break;
            case "GTE": triggered = value >= rule.threshold; break;
            case "LT": triggered = value < rule.threshold; break;
            case "LTE": triggered = value <= rule.threshold; break;
            case "EQ": triggered = value === rule.threshold; break;
        }

        if (triggered) {
            // Logic for type:
            // If GT/GTE, it's usually a warning/danger if it's a cost (e.g. CPA)
            // or info if it's a volume (e.g. Orders)
            // For simplicity, we'll default to WARNING which is monochrome in TableAlert
            activeAlerts.push({
                type: "WARNING",
                label: rule.label,
                description: `${rule.field.toUpperCase()} (${value}) cumple la condición ${rule.operator} ${rule.threshold}`
            });
        }
    }

    return activeAlerts;
}
