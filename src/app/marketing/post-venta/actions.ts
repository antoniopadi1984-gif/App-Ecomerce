'use server';

export async function calculateOrderRisk(orderId: string): Promise<any> { return { riskScore: 0, riskLevel: 'LOW', reasons: [], strategy: '' }; }
export async function generateReinforcementContent(orderId: string): Promise<any> { return { headline: '', body: '', bonusTip: '', reasonToAccept: '' }; }
