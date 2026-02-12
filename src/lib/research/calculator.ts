export interface EconomicsResult {
    unitCost: number;
    shippingCost: number;
    handlingCost: number;
    returnRate: number; // e.g. 0.1 for 10%
    vatPercent: number; // e.g. 21
    adsPerSale: number;
    codFee: number;

    pvpRecommendations: {
        aggressive: PriceBreakdown; // 25-30% margin
        premium: PriceBreakdown;    // 35-45% margin
    };
    valueStacks?: any[];
}

export interface PriceBreakdown {
    pvp: number;
    vat: number;
    cogs: number; // unitCost
    shippingTotal: number; // shipping + handling + (returnCost * returnRate)
    returnsCost: number;
    codFees: number;
    adsCost: number;
    netMargin: number;
    marginPercent: number;
}

export class EconomicsCalculator {
    static calculate(params: {
        unitCost: number;
        shippingCost: number;
        handlingCost: number;
        returnCost: number;
        returnRate: number;
        vatPercent: number;
        adsPerSale: number;
        codFeePercent: number;
    }): EconomicsResult {
        const { unitCost, shippingCost, handlingCost, returnCost, returnRate, vatPercent, adsPerSale, codFeePercent } = params;

        const getBreakdown = (targetMarginPercent: number): PriceBreakdown => {
            // Estimate PVP needed to hit margin
            // NetProfit = PVP/(1+VAT) - UnitCost - (Shipping + Handling) - (ReturnCost * ReturnRate) - Ads - (PVP/(1+VAT) * CODFee%)
            // NetProfit = PVP_HT * (1 - CODFee%) - Costs
            // Margin% = NetProfit / PVP_HT
            // TargetMargin * PVP_HT = PVP_HT * (1 - CODFee%) - Costs
            // PVP_HT * (1 - CODFee% - TargetMargin) = Costs
            // PVP_HT = Costs / (1 - CODFee% - TargetMargin)

            const fixedCosts = unitCost + shippingCost + handlingCost + (returnCost * returnRate) + adsPerSale;
            const targetMargin = targetMarginPercent / 100;
            const codFee = codFeePercent / 100;

            const pvpHt = fixedCosts / (1 - codFee - targetMargin);
            const pvp = pvpHt * (1 + vatPercent / 100);

            const vat = pvp - pvpHt;
            const codFees = pvpHt * codFee;
            const shippingTotal = shippingCost + handlingCost;
            const returnsCost = returnCost * returnRate;

            const netMargin = pvpHt - unitCost - shippingTotal - returnsCost - adsPerSale - codFees;

            return {
                pvp: Math.round(pvp * 100) / 100,
                vat,
                cogs: unitCost,
                shippingTotal,
                returnsCost,
                codFees,
                adsCost: adsPerSale,
                netMargin,
                marginPercent: (netMargin / pvpHt) * 100
            };
        };

        return {
            unitCost,
            shippingCost,
            handlingCost,
            returnRate,
            vatPercent,
            adsPerSale,
            codFee: codFeePercent,
            pvpRecommendations: {
                aggressive: getBreakdown(27), // 25-30%
                premium: getBreakdown(40)     // 35-45%
            },
            valueStacks: this.generateValueStacks(unitCost)
        };
    }

    static generateValueStacks(unitCost: number) {
        return [
            {
                name: "The 'Getting Started' Bundle",
                items: ["Product Main", "Masterclass Access (Digital)", "Quick Start Guide"],
                perceivedValue: 97,
                realCost: unitCost + 0.5,
                marginImpact: "LOW",
                psychologicalTrigger: "Autoridad + Alivio"
            },
            {
                name: "The 'Total Transformation' Stack",
                items: ["Product Main (x2)", "VIP Support (Digital)", "Secret Community Access", "Extended Warranty"],
                perceivedValue: 197,
                realCost: (unitCost * 2) + 2,
                marginImpact: "MEDIUM",
                psychologicalTrigger: "Social Proof + Seguridad"
            }
        ];
    }
}
