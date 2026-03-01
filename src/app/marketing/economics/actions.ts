'use server';

export type BreakevenMetrics = {
    breakevenROAS: number;
    breakevenCPC: number;
    totalCostWithVAT: number;
    grossMarginPercent: number;
    clicksNeeded: number;
};

export async function calculateProductEconomicsAction(productId: string): Promise<any> { return { success: true }; }
export async function getProductEconomicsDashboardAction(productId: string): Promise<any> { return { success: true, breakeven: null }; }
export async function updateProductPricingAction(productId: string, data: any): Promise<any> { return { success: true }; }
export async function createPricingOfferAction(productId: string, data: any): Promise<any> { return { success: true }; }
