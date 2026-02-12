/**
 * UNIT ECONOMICS & PRICING MODULE
 * Calculate breakeven metrics, ROAS, CPC, and optimize pricing
 */

export interface ProductEconomics {
    // Costs
    unitCost: number;           // COGS
    shippingCost: number;       // Shipping per unit
    handlingCost: number;       // Handling/packaging
    returnCost: number;         // Average return cost
    adSpend?: number;           // Total ad spend (optional)

    // Pricing
    currentPrice: number;       // Current selling price
    desiredPrice?: number;      // Target price
    compareAtPrice?: number;    // Original price (for discounts)

    // Taxes
    vatPercent: number;         // VAT percentage

    // Margins
    margin?: number;            // Profit margin
    marginPercent?: number;     // Profit margin %
}

export interface BreakevenMetrics {
    // Total costs
    totalCost: number;          // Unit + shipping + handling + return
    totalCostWithVAT: number;   // Including VAT

    // Breakeven points
    breakevenPrice: number;     // Min price to cover costs
    breakevenROAS: number;      // Min ROAS needed
    breakevenCPC: number;       // Max CPC allowed

    // Margins
    grossMargin: number;        // Revenue - costs
    grossMarginPercent: number; // Margin %
    netMargin: number;          // After VAT
    netMarginPercent: number;   // Net margin %

    // Conversion assumptions
    conversionRate: number;     // Assumed CR (default 2%)
    clicksNeeded: number;       // Clicks for 1 sale
}

export interface PricingOffer {
    id: string;
    name: string;               // "Bundle 2x", "Upsell Premium"
    products: Array<{
        quantity: number;
        unitPrice: number;
    }>;
    totalPrice: number;         // Final price
    totalCost: number;          // Total COGS
    aov: number;                // Average Order Value
    margin: number;
    marginPercent: number;
}

/**
 * Calculate comprehensive breakeven metrics
 */
export function calculateBreakeven(
    economics: ProductEconomics,
    conversionRate: number = 0.02 // Default 2% CR
): BreakevenMetrics {
    const {
        unitCost,
        shippingCost,
        handlingCost,
        returnCost,
        currentPrice,
        vatPercent
    } = economics;

    // Total cost per unit
    const totalCost = unitCost + shippingCost + handlingCost + returnCost;

    // VAT multiplier (e.g., 21% = 1.21)
    const vatMultiplier = 1 + (vatPercent / 100);
    const totalCostWithVAT = totalCost * vatMultiplier;

    // Breakeven price (min price to cover all costs including VAT)
    const breakevenPrice = totalCostWithVAT;

    // Gross margin (before VAT)
    const grossMargin = currentPrice - totalCost;
    const grossMarginPercent = (grossMargin / currentPrice) * 100;

    // Net margin (after VAT)
    const priceWithVAT = currentPrice * vatMultiplier;
    const netMargin = currentPrice - totalCostWithVAT;
    const netMarginPercent = (netMargin / priceWithVAT) * 100;

    // Breakeven ROAS
    // ROAS = Revenue / Ad Spend
    // At breakeven: Revenue = Total Cost
    // So minimum ROAS = Total Cost / Max Ad Spend
    // Max Ad Spend at breakeven = Revenue - Total Cost = Margin
    // Therefore: Breakeven ROAS = Revenue / Margin
    const breakevenROAS = grossMargin > 0 ? currentPrice / grossMargin : Infinity;

    // Breakeven CPC
    // CPC = Ad Spend / Clicks
    // At breakeven: Ad Spend = Margin
    // Clicks needed = 1 / Conversion Rate
    // Therefore: Max CPC = Margin / Clicks Needed
    const clicksNeeded = 1 / conversionRate;
    const breakevenCPC = grossMargin > 0 ? grossMargin / clicksNeeded : 0;

    return {
        totalCost,
        totalCostWithVAT,
        breakevenPrice,
        breakevenROAS,
        breakevenCPC,
        grossMargin,
        grossMarginPercent,
        netMargin,
        netMarginPercent,
        conversionRate,
        clicksNeeded
    };
}

/**
 * Evaluate pricing offer (bundle, upsell, etc.)
 */
export function evaluateOffer(
    offer: {
        name: string;
        items: Array<{ unitCost: number; quantity: number; unitPrice: number }>;
        shippingCost: number;
        handlingCost: number;
    },
    vatPercent: number = 21
): PricingOffer {
    // Calculate totals
    const totalCost = offer.items.reduce((sum, item) =>
        sum + (item.unitCost * item.quantity), 0
    ) + offer.shippingCost + offer.handlingCost;

    const totalPrice = offer.items.reduce((sum, item) =>
        sum + (item.unitPrice * item.quantity), 0
    );

    const aov = totalPrice;
    const margin = totalPrice - totalCost;
    const marginPercent = (margin / totalPrice) * 100;

    return {
        id: `offer_${Date.now()}`,
        name: offer.name,
        products: offer.items.map(item => ({
            quantity: item.quantity,
            unitPrice: item.unitPrice
        })),
        totalPrice,
        totalCost,
        aov,
        margin,
        marginPercent
    };
}

/**
 * Get pricing recommendations
 */
export function getPricingRecommendations(
    economics: ProductEconomics,
    targetMarginPercent: number = 40 // Target 40% margin
): {
    recommendedPrice: number;
    minPrice: number;
    maxPrice: number;
    reasoning: string;
} {
    const breakeven = calculateBreakeven(economics);

    // Recommended price for target margin
    const recommendedPrice = breakeven.totalCostWithVAT / (1 - (targetMarginPercent / 100));

    // Min price (breakeven + 10% safety margin)
    const minPrice = breakeven.breakevenPrice * 1.1;

    // Max price (2x recommended or compare at price)
    const maxPrice = economics.compareAtPrice || (recommendedPrice * 2);

    let reasoning = `Para alcanzar ${targetMarginPercent}% de margen, `;
    reasoning += `el precio recomendado es €${recommendedPrice.toFixed(2)}. `;
    reasoning += `El precio mínimo viable es €${minPrice.toFixed(2)} `;
    reasoning += `(breakeven + 10% margen de seguridad).`;

    return {
        recommendedPrice,
        minPrice,
        maxPrice,
        reasoning
    };
}

/**
 * Create alert thresholds for agents
 */
export interface AlertThresholds {
    roasMin: number;            // Alert if ROAS < this
    roasWarning: number;        // Warning if ROAS < this
    cpcMax: number;             // Alert if CPC > this
    cpcWarning: number;         // Warning if CPC > this
    marginMin: number;          // Alert if margin < this %
    conversionRateMin: number;  // Alert if CR < this
}

export function generateAlertThresholds(
    breakeven: BreakevenMetrics,
    safetyMargin: number = 1.2 // 20% safety margin
): AlertThresholds {
    return {
        roasMin: breakeven.breakevenROAS * safetyMargin,
        roasWarning: breakeven.breakevenROAS * (safetyMargin * 1.5),
        cpcMax: breakeven.breakevenCPC / safetyMargin,
        cpcWarning: breakeven.breakevenCPC / (safetyMargin * 1.5),
        marginMin: 20, // Minimum 20% margin
        conversionRateMin: breakeven.conversionRate * 0.5 // 50% of expected CR
    };
}

/**
 * Check if metrics are within safe thresholds
 */
export function checkAlerts(
    actualMetrics: {
        roas?: number;
        cpc?: number;
        marginPercent?: number;
        conversionRate?: number;
    },
    thresholds: AlertThresholds
): {
    alerts: string[];
    warnings: string[];
    status: 'HEALTHY' | 'WARNING' | 'CRITICAL';
} {
    const alerts: string[] = [];
    const warnings: string[] = [];

    // Check ROAS
    if (actualMetrics.roas !== undefined) {
        if (actualMetrics.roas < thresholds.roasMin) {
            alerts.push(`ROAS crítico: ${actualMetrics.roas.toFixed(2)} < ${thresholds.roasMin.toFixed(2)}`);
        } else if (actualMetrics.roas < thresholds.roasWarning) {
            warnings.push(`ROAS bajo: ${actualMetrics.roas.toFixed(2)} < ${thresholds.roasWarning.toFixed(2)}`);
        }
    }

    // Check CPC
    if (actualMetrics.cpc !== undefined) {
        if (actualMetrics.cpc > thresholds.cpcMax) {
            alerts.push(`CPC crítico: €${actualMetrics.cpc.toFixed(2)} > €${thresholds.cpcMax.toFixed(2)}`);
        } else if (actualMetrics.cpc > thresholds.cpcWarning) {
            warnings.push(`CPC alto: €${actualMetrics.cpc.toFixed(2)} > €${thresholds.cpcWarning.toFixed(2)}`);
        }
    }

    // Check margin
    if (actualMetrics.marginPercent !== undefined) {
        if (actualMetrics.marginPercent < thresholds.marginMin) {
            alerts.push(`Margen crítico: ${actualMetrics.marginPercent.toFixed(1)}% < ${thresholds.marginMin}%`);
        }
    }

    // Check conversion rate
    if (actualMetrics.conversionRate !== undefined) {
        if (actualMetrics.conversionRate < thresholds.conversionRateMin) {
            warnings.push(`CR bajo: ${(actualMetrics.conversionRate * 100).toFixed(2)}% < ${(thresholds.conversionRateMin * 100).toFixed(2)}%`);
        }
    }

    const status = alerts.length > 0 ? 'CRITICAL' : warnings.length > 0 ? 'WARNING' : 'HEALTHY';

    return { alerts, warnings, status };
}
