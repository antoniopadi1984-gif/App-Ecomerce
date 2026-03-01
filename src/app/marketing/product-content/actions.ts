'use server';

export async function updateProductInfoAction(productId: string, data: any): Promise<any> { return { success: true }; }
export async function getProductInfoAction(productId: string): Promise<any> { return { success: true, data: null }; }
