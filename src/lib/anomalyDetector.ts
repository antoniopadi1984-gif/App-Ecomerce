export interface Anomaly {
    week: number;
    type: "drop" | "spike";
    magnitude: number;
}

export function detectAnomalies(weeklyValues: number[]): Anomaly[] {
    const anomalies: Anomaly[] = [];

    for (let i = 1; i < weeklyValues.length; i++) {
        const prev = weeklyValues[i - 1];
        const curr = weeklyValues[i];

        // Ignore if previous week is zero (infinite growth) OR if current data is not yet recorded
        if (!prev || curr === undefined || curr === null) continue;

        // Prevent false drops on $0 current values if they are genuinely empty, but typically 0 means 0
        // so we calculate drop.
        const change = ((curr - prev) / prev) * 100;

        // Caída brusca: más del 25% en una semana
        if (change <= -25) {
            anomalies.push({ week: i + 1, type: "drop", magnitude: change });
        }
        // Pico: más del 40% en una semana
        if (change >= 40) {
            anomalies.push({ week: i + 1, type: "spike", magnitude: change });
        }
    }

    return anomalies;
}
