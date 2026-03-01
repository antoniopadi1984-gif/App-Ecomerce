'use server';

export async function getOrCreateCreativeAgent(storeId: string, role: string, options: any): Promise<any> { return {}; }
export async function updateAgentPrompt(agentId: string, instructions: string) { return { success: true }; }
export async function addAgentExample(agentId: string, example: any) { return { success: true, examples: [] }; }
export async function removeAgentExample(agentId: string, index: number) { return { success: true, examples: [] }; }
export async function generateWithAgent(payload: any): Promise<any> { return { success: true, text: "", context: null }; }
