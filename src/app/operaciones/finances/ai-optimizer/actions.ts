'use server';

export async function getFinancialAdvice(goal: string): Promise<{ success: boolean; text?: string }> {
    return { success: true, text: "Estrategia financiera generada correctamente." };
}
