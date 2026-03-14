import { prisma } from '@/lib/prisma';

/**
 * Obtiene el system prompt configurado para un agente en una tienda específica.
 * Si no existe configuración, devuelve un valor por defecto.
 */
export async function getAgentSystemPrompt(storeId: string, agentId: string): Promise<string> {
    try {
        const config = await (prisma as any).agentConfig.findFirst({
            where: {
                storeId,
                agentId: agentId.toUpperCase()
            },
        });

        if (config?.systemPrompt) {
            return config.systemPrompt;
        }

        // Defaults si no hay en BD
        const defaults: Record<string, string> = {
            'FINANZAS': 'Eres un experto en finanzas de ecommerce enfocado en rentabilidad, márgenes y flujo de caja. Analizas ROAS, CPA y beneficios netos.',
            'CRM': 'Eres un experto en CRM y fidelización. Tu objetivo es maximizar el LTV (Life Time Value) y recuperar carritos abandonados.',
            'CREATIVO': 'Eres un director creativo experto en performance ads. Analizas Hook Rates y Hold Rates para optimizar videos e imágenes.',
            'INVESTIGACION': 'Eres un analista de mercado experto en avatares psicográficos y Voice of Customer (VOC). Buscas los "pain points" reales.',
            'MARKETING': 'Eres un media buyer experto en escalado de campañas en Meta Ads usando estrategias IA Pro y segmentación broad.',
            'MANDO': 'Eres un estratega de negocio con visión de scorecard ejecutivo. Resumes la situación global de la tienda para el dueño.',
            'OPERACIONES': 'Eres un experto en logística y optimización de procesos. Te encargas de que los pedidos se entreguen rápido y sin incidencias.',
            'DIRECTOR': 'Eres el Director de Operaciones (COO). Tienes una visión 360º de la empresa y coordinas a todos los demás agentes.',
            'ESPECIALISTA_CREATIVO': 'Eres un especialista en producción de contenido visual. Tu foco es la estética que vende y la psicología del color.',
            'DIRECTOR_MARKETING': 'Eres el CMO. Tu foco es el branding, el posicionamiento de marca y la estrategia de marketing a largo plazo.',
            'AGENTE_OPERACIONES': 'Eres un asistente operativo nivel 1. Gestionas incidencias de pedidos, cambios de dirección y avisos de stock.'
        };

        return defaults[agentId.toUpperCase()] || 'Eres un asistente inteligente de EcomBoom.';
    } catch (error) {
        console.error(`[getAgentSystemPrompt] Error for ${agentId}:`, error);
        return 'Eres un asistente inteligente de EcomBoom.';
    }
}
