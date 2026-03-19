import { API_CONFIG } from '../config/api-config';
import { REPLICATE_MODELS } from '../ai/replicate-models';
import { DEFAULT_AGENT_PROMPTS } from '../ai/defaults/agent-prompts';

export type AgentRole =
  | 'neural-mother'
  | 'funnel-architect'
  | 'video-intelligence'
  | 'image-director'
  | 'research-core'
  | 'media-buyer'
  | 'ops-commander'
  | 'drive-intelligence'
  // Legacy — mantener para compatibilidad con código existente que los referencia
  | 'copywriter-elite'
  | 'landing-creator'
  | 'script-generator'
  | 'video-director'
  | 'research-lab'
  | 'competitor-analyst'
  | 'avatar-creator'
  | 'angle-engineer'
  | 'value-designer'
  | 'cro-optimizer'
  | 'order-tracker'
  | 'incident-manager'
  | 'daily-accountant'
  | 'media-buyer-elite'
  | 'metrics-analyzer'
  | 'drive-organizer'
  | 'general';

export type ModelProvider = 'replicate-claude' | 'gemini-pro' | 'gemini-flash' | 'anthropic';

export interface AgentConfig {
    role: AgentRole;
    provider: ModelProvider;
    model: string;
    temperature: number;
    maxTokens: number;
    systemPrompt: string;
    description: string;
    tier: 1 | 2 | 3;
    costTier: 'premium' | 'standard' | 'economic';
}

export const AGENT_CONFIGS: Record<AgentRole, AgentConfig> = {

    // ============================================
    // NUEVOS ROLES MAESTROS (System mapping)
    // ============================================

    'neural-mother': {
        role: 'neural-mother',
        provider: 'anthropic',
        model: 'claude-sonnet-4-5',
        temperature: 0.3,
        maxTokens: 8192,
        systemPrompt: DEFAULT_AGENT_PROMPTS.NEURAL_MOTHER,
        description: 'Agente Jefe — diagnóstico ejecutivo y coordinación de todos los agentes',
        tier: 1,
        costTier: 'premium'
    },

    'funnel-architect': {
        role: 'funnel-architect',
        provider: 'anthropic',
        model: 'claude-sonnet-4-5',
        temperature: 0.7,
        maxTokens: 16384,
        systemPrompt: DEFAULT_AGENT_PROMPTS.FUNNEL_ARCHITECT,
        description: 'Landing + Advertorial + Listicle + Oferta + CRO — todo en uno',
        tier: 1,
        costTier: 'premium'
    },

    'video-intelligence': {
        role: 'video-intelligence',
        provider: 'gemini-pro',
        model: API_CONFIG.vertexAI.models.gemini.production,
        temperature: 0.5,
        maxTokens: 8192,
        systemPrompt: DEFAULT_AGENT_PROMPTS.VIDEO_INTELLIGENCE,
        description: 'Análisis + guión + dirección + UGC — todo lo de vídeo',
        tier: 1,
        costTier: 'premium'
    },

    'image-director': {
        role: 'image-director',
        provider: 'anthropic',
        model: 'claude-sonnet-4-5',
        temperature: 0.6,
        maxTokens: 4096,
        systemPrompt: DEFAULT_AGENT_PROMPTS.IMAGE_DIRECTOR,
        description: 'Imágenes estáticas + carruseles + JSON estructurado para generación IA',
        tier: 1,
        costTier: 'premium'
    },

    'research-core': {
        role: 'research-core',
        provider: 'gemini-pro',
        model: 'gemini-3.1-pro-preview',
        temperature: 0.3,
        maxTokens: 65536,
        systemPrompt: `Eres el RESEARCH CORE. Ejecutas la investigación P1 a P7 secuencialmente.
Tu trabajo es extraer la verdad del mercado: Mass Desires, Pain Points, VOC (Voice of Customer), Competencia y Psicografía.
Sin tu investigación, el resto de agentes están ciegos. Proporcionas la base de datos de insights.`,
        description: 'Núcleo de investigación profunda de mercado y cliente',
        tier: 2,
        costTier: 'standard'
    },

    'media-buyer': {
        role: 'media-buyer',
        provider: 'gemini-pro',
        model: API_CONFIG.vertexAI.models.gemini.production,
        temperature: 0.3,
        maxTokens: 4096,
        systemPrompt: DEFAULT_AGENT_PROMPTS.MEDIA_BUYER,
        description: 'Meta Ads: análisis + escalado + diagnóstico de creativos',
        tier: 1,
        costTier: 'premium'
    },

    'ops-commander': {
        role: 'ops-commander',
        provider: 'gemini-flash',
        model: 'gemini-3.1-flash-lite-preview',
        temperature: 0.2,
        maxTokens: 4096,
        systemPrompt: DEFAULT_AGENT_PROMPTS.OPS_COMMANDER,
        description: 'Pedidos + incidencias + equipo + postventa — todo operacional',
        tier: 1,
        costTier: 'premium'
    },

    'drive-intelligence': {
        role: 'drive-intelligence',
        provider: 'gemini-pro',
        model: API_CONFIG.vertexAI.models.gemini.production,
        temperature: 0.1,
        maxTokens: 2048,
        systemPrompt: DEFAULT_AGENT_PROMPTS.DRIVE_INTELLIGENCE,
        description: 'Organización automática de Drive — nomenclatura y clasificación',
        tier: 2,
        costTier: 'standard'
    },

    // ============================================
    // LEGACY / COMPATIBILITY CONFIGS
    // ============================================

    'copywriter-elite': {
        role: 'copywriter-elite',
        provider: 'replicate-claude',
        model: REPLICATE_MODELS.TEXT.CLAUDE_SONNET,
        temperature: 0.8,
        maxTokens: 4096,
        systemPrompt: `Eres un copywriter de élite especializado en direct response marketing y persuasión (Redireccionado a FUNNEL ARCHITECT).`,
        description: 'Legacy - Ver Funnel Architect',
        tier: 1,
        costTier: 'premium'
    },

    'cro-optimizer': {
        role: 'cro-optimizer',
        provider: 'replicate-claude',
        model: REPLICATE_MODELS.TEXT.CLAUDE_SONNET,
        temperature: 0.6,
        maxTokens: 4096,
        systemPrompt: `Eres un experto en CRO (Redireccionado a FUNNEL ARCHITECT).`,
        description: 'Legacy - Ver Funnel Architect',
        tier: 1,
        costTier: 'premium'
    },

    'script-generator': {
        role: 'script-generator',
        provider: 'replicate-claude',
        model: REPLICATE_MODELS.TEXT.CLAUDE_SONNET,
        temperature: 0.7,
        maxTokens: 3072,
        systemPrompt: `Eres un guionista experto (Redireccionado a VIDEO INTELLIGENCE).`,
        description: 'Legacy - Ver Video Intelligence',
        tier: 1,
        costTier: 'premium'
    },

    'landing-creator': {
        role: 'landing-creator',
        provider: 'replicate-claude',
        model: REPLICATE_MODELS.TEXT.CLAUDE_SONNET,
        temperature: 0.7,
        maxTokens: 6144,
        systemPrompt: `Eres un especialista en landing pages (Redireccionado a FUNNEL ARCHITECT).`,
        description: 'Legacy - Ver Funnel Architect',
        tier: 1,
        costTier: 'premium'
    },

    'research-lab': {
        role: 'research-lab',
        provider: 'gemini-pro',
        model: API_CONFIG.vertexAI.models.gemini.production,
        temperature: 0.3,
        maxTokens: 8192,
        systemPrompt: `Eres un investigador de mercado (Redireccionado a RESEARCH CORE).`,
        description: 'Legacy - Ver Research Core',
        tier: 2,
        costTier: 'standard'
    },

    'competitor-analyst': {
        role: 'competitor-analyst',
        provider: 'gemini-pro',
        model: API_CONFIG.vertexAI.models.gemini.production,
        temperature: 0.3,
        maxTokens: 6144,
        systemPrompt: `Analista de competencia (Redireccionado a RESEARCH CORE).`,
        description: 'Legacy - Ver Research Core',
        tier: 2,
        costTier: 'standard'
    },

    'avatar-creator': {
        role: 'avatar-creator',
        provider: 'gemini-pro',
        model: API_CONFIG.vertexAI.models.gemini.production,
        temperature: 0.4,
        maxTokens: 8192,
        systemPrompt: `Perfilador de marketing (Redireccionado a RESEARCH CORE).`,
        description: 'Legacy - Ver Research Core',
        tier: 2,
        costTier: 'standard'
    },

    'angle-engineer': {
        role: 'angle-engineer',
        provider: 'gemini-pro',
        model: API_CONFIG.vertexAI.models.gemini.production,
        temperature: 0.5,
        maxTokens: 6144,
        systemPrompt: `Ingeniero de ángulos (Redireccionado a RESEARCH CORE).`,
        description: 'Legacy - Ver Research Core',
        tier: 2,
        costTier: 'standard'
    },

    'value-designer': {
        role: 'value-designer',
        provider: 'replicate-claude',
        model: REPLICATE_MODELS.TEXT.CLAUDE_SONNET,
        temperature: 0.6,
        maxTokens: 4096,
        systemPrompt: `Diseñador de ofertas (Redireccionado a FUNNEL ARCHITECT).`,
        description: 'Legacy - Ver Funnel Architect',
        tier: 1,
        costTier: 'premium'
    },

    'order-tracker': {
        role: 'order-tracker',
        provider: 'gemini-flash',
        model: API_CONFIG.vertexAI.models.gemini.fast,
        temperature: 0.3,
        maxTokens: 1024,
        systemPrompt: `Seguimiento de pedidos (Redireccionado a OPS COMMANDER).`,
        description: 'Legacy - Ver Ops Commander',
        tier: 3,
        costTier: 'economic'
    },

    'incident-manager': {
        role: 'incident-manager',
        provider: 'gemini-flash',
        model: API_CONFIG.vertexAI.models.gemini.fast,
        temperature: 0.3,
        maxTokens: 2048,
        systemPrompt: `Gestor de incidencias (Redireccionado a OPS COMMANDER).`,
        description: 'Legacy - Ver Ops Commander',
        tier: 3,
        costTier: 'economic'
    },

    'daily-accountant': {
        role: 'daily-accountant',
        provider: 'gemini-flash',
        model: API_CONFIG.vertexAI.models.gemini.fast,
        temperature: 0.2,
        maxTokens: 3072,
        systemPrompt: `Contador diario (Redireccionado a OPS COMMANDER).`,
        description: 'Legacy - Ver Ops Commander',
        tier: 3,
        costTier: 'economic'
    },

    'media-buyer-elite': {
        role: 'media-buyer-elite',
        provider: 'replicate-claude',
        model: REPLICATE_MODELS.TEXT.CLAUDE_SONNET,
        temperature: 0.7,
        maxTokens: 4096,
        systemPrompt: `Media Buyer Elite (Redireccionado a MEDIA BUYER).`,
        description: 'Legacy - Ver Media Buyer',
        tier: 1,
        costTier: 'premium'
    },

    'metrics-analyzer': {
        role: 'metrics-analyzer',
        provider: 'gemini-flash',
        model: API_CONFIG.vertexAI.models.gemini.fast,
        temperature: 0.3,
        maxTokens: 3072,
        systemPrompt: `Analista de métricas (Redireccionado a MEDIA BUYER).`,
        description: 'Legacy - Ver Media Buyer',
        tier: 3,
        costTier: 'economic'
    },

    'drive-organizer': {
        role: 'drive-organizer',
        provider: 'gemini-flash',
        model: API_CONFIG.vertexAI.models.gemini.fast,
        temperature: 0.4,
        maxTokens: 2048,
        systemPrompt: `Organizador de Drive (Redireccionado a DRIVE INTELLIGENCE).`,
        description: 'Legacy - Ver Drive Intelligence',
        tier: 3,
        costTier: 'economic'
    },

    'video-director': {
        role: 'video-director',
        provider: 'replicate-claude',
        model: REPLICATE_MODELS.TEXT.CLAUDE_SONNET,
        temperature: 0.7,
        maxTokens: 8192,
        systemPrompt: DEFAULT_AGENT_PROMPTS.VIDEO_DIRECTOR,
        description: 'Director de Scripts de Video — Meta Ads respuesta directa, Eugene Schwartz framework',
        tier: 1,
        costTier: 'premium'
    },

    'general': {
        role: 'general',
        provider: 'gemini-flash',
        model: API_CONFIG.vertexAI.models.gemini.fast,
        temperature: 0.5,
        maxTokens: 2048,
        systemPrompt: 'Eres un asistente de IA útil y versátil.',
        description: 'Propósito general',
        tier: 3,
        costTier: 'economic'
    }
};

// Helper para obtener config de agente
export function getAgentConfig(role: AgentRole): AgentConfig {
    return AGENT_CONFIGS[role];
}

// Helper para seleccionar agente según tarea
export function selectAgentForTask(taskDescription: string): AgentRole {
    const lower = taskDescription.toLowerCase();

    // NUEVO MAPEO MAESTRO
    if (lower.includes('mother') || lower.includes('coordinar') || lower.includes('jefe')) {
        return 'neural-mother';
    }
    
    // Funnel Architect
    if (lower.includes('funnel') || lower.includes('landing') || lower.includes('copy') || lower.includes('oferta') || lower.includes('cro')) {
        return 'funnel-architect';
    }

    // Video Intelligence
    if (lower.includes('video') || lower.includes('script') || lower.includes('guion') || lower.includes('ugc') || lower.includes('shot list')) {
        return 'video-intelligence';
    }

    // Image Director
    if (lower.includes('imagen') || lower.includes('image') || lower.includes('static') || lower.includes('packaging') || lower.includes('badge')) {
        return 'image-director';
    }

    // Research Core
    if (lower.includes('research') || lower.includes('investigación') || lower.includes('p1') || lower.includes('p7') || lower.includes('mercado') || lower.includes('competidor') || lower.includes('avatar') || lower.includes('voc')) {
        return 'research-core';
    }

    // Media Buyer
    if (lower.includes('pauta') || lower.includes('ads') || lower.includes('meta') || lower.includes('rendimiento') || lower.includes('escalar') || lower.includes('metrics')) {
        return 'media-buyer';
    }

    // Ops Commander
    if (lower.includes('ops') || lower.includes('pedido') || lower.includes('incidencia') || lower.includes('logística') || lower.includes('comunicación') || lower.includes('notificación') || lower.includes('contador') || lower.includes('finanzas')) {
        return 'ops-commander';
    }

    // Drive Intelligence
    if (lower.includes('drive') || lower.includes('organiza') || lower.includes('nomenclatura') || lower.includes('archivo') || lower.includes('carpeta')) {
        return 'drive-intelligence';
    }

    return 'general';
}

// Helper para obtener provider del agente
export function getAgentProvider(role: AgentRole): ModelProvider {
    return AGENT_CONFIGS[role].provider;
}

// Stats helper
export function getAgentStats() {
    const configs = Object.values(AGENT_CONFIGS);
    return {
        total: configs.length,
        byProvider: {
            replicateClaude: configs.filter(c => c.provider === 'replicate-claude').length,
            geminiPro: configs.filter(c => c.provider === 'gemini-pro').length,
            geminiFlash: configs.filter(c => c.provider === 'gemini-flash').length
        },
        byTier: {
            tier1: configs.filter(c => c.tier === 1).length,
            tier2: configs.filter(c => c.tier === 2).length,
            tier3: configs.filter(c => c.tier === 3).length
        },
        byCost: {
            premium: configs.filter(c => c.costTier === 'premium').length,
            standard: configs.filter(c => c.costTier === 'standard').length,
            economic: configs.filter(c => c.costTier === 'economic').length
        }
    };
}
