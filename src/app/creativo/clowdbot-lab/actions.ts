'use server';

export async function updateClowdbotConfig(storeId?: string, data?: any) { return { success: true }; }
export async function getClowdbotConfig(storeId?: string): Promise<any> { return null; }
export async function getWhatsAppAccounts(storeId?: string): Promise<any> { return { success: true, data: [] }; }
export async function addWhatsAppAccount(payload: any) { return { success: true }; }
export async function deleteWhatsAppAccount(accountId?: string) { return { success: true }; }
