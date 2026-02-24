/**
 * Configuración centralizada de todas las APIs
 * Versiones estables - Febrero 2025
 */

export const API_CONFIG = {
    // ============================================
    // VERTEX AI
    // ============================================
    vertexAI: {
        projectId: process.env.GOOGLE_CLOUD_PROJECT_ID || '',
        location: process.env.GOOGLE_CLOUD_LOCATION || 'eu',
        apiKey: process.env.VERTEX_AI_API_KEY || '',

        models: {
            // Gemini - Text Generation
            gemini: {
                production: process.env.GEMINI_MODEL_PRODUCTION || 'gemini-2.0-flash-exp',
                fast: process.env.GEMINI_MODEL_FAST || 'gemini-2.0-flash-exp',
                endpoint: 'v1'
            },

            // Imagen 3 - Image Generation
            imagen: {
                model: process.env.IMAGEN_MODEL || 'imagen-3.0-generate-001',
                endpoint: 'v1'
            }
        },

        storage: {
            bucketName: process.env.GCS_BUCKET_NAME || 'ecompulse-creatives'
        },

        search: {
            dataStoreId: process.env.VERTEX_SEARCH_DATA_STORE_ID || '',
            engineId: process.env.VERTEX_SEARCH_ENGINE_ID || '',
            endpoint: 'v1'
        }
    },

    // ============================================
    // REPLICATE
    // ============================================
    replicate: {
        apiToken: process.env.REPLICATE_API_TOKEN || '',

        models: {
            livePortrait: process.env.REPLICATE_LIVEPORTRAIT || 'fofr/live-portrait:89629de4f370173b28ccf588d19540a7c349cf3cc9a1935b22cd45f9b2b55a11',
            sadTalker: process.env.REPLICATE_SADTALKER || 'cjwbw/sadtalker:3aa3dac9353cc4d6bd62a35e0f571bf7ce2b05b8e0b8b9de0e4e472f8de50f26',
            fluxDev: process.env.REPLICATE_FLUX_DEV || 'black-forest-labs/flux-dev'
        }
    },

    // ============================================
    // ELEVENLABS
    // ============================================
    elevenLabs: {
        apiKey: process.env.ELEVENLABS_API_KEY || '',
        endpoint: 'https://api.elevenlabs.io/v1',
        model: process.env.ELEVENLABS_MODEL || 'eleven_multilingual_v2',

        voices: {
            male: process.env.ELEVENLABS_VOICE_MALE || 'pNInz6obpgDQGcFmaJgB',
            female: process.env.ELEVENLABS_VOICE_FEMALE || 'EXAVITQu4vr4xnSDxMaL'
        }
    },

    // ============================================
    // GOOGLE CLOUD TTS
    // ============================================
    googleTTS: {
        voices: {
            male: process.env.GOOGLE_TTS_VOICE_MALE || 'es-ES-Neural2-B',
            female: process.env.GOOGLE_TTS_VOICE_FEMALE || 'es-ES-Neural2-A'
        }
    },

    // ============================================
    // FEATURE FLAGS
    // ============================================
    features: {
        useElevenLabs: process.env.USE_ELEVENLABS === 'true',
        useGoogleTTS: process.env.USE_GOOGLE_TTS === 'true',
        useVertexSearch: process.env.USE_VERTEX_SEARCH === 'true'
    }
} as const;

// Validación de configuración
export function validateConfig(): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Verificar Vertex AI
    if (!API_CONFIG.vertexAI.projectId) {
        errors.push('GOOGLE_CLOUD_PROJECT_ID no configurado');
    }
    if (!API_CONFIG.vertexAI.apiKey) {
        errors.push('VERTEX_AI_API_KEY no configurado');
    }

    // Verificar Replicate (si se va a usar)
    if (!API_CONFIG.replicate.apiToken) {
        errors.push('REPLICATE_API_TOKEN no configurado');
    }

    // Verificar TTS (al menos uno debe estar configurado)
    if (!API_CONFIG.elevenLabs.apiKey && !API_CONFIG.features.useGoogleTTS) {
        errors.push('Ni ELEVENLABS_API_KEY ni Google TTS están configurados');
    }

    return {
        valid: errors.length === 0,
        errors
    };
}

// Helper para obtener endpoint completo de Vertex AI
export function getVertexAIEndpoint(service: 'gemini' | 'imagen' | 'search'): string {
    const { projectId, location } = API_CONFIG.vertexAI;

    switch (service) {
        case 'gemini':
            return `https://${location}-aiplatform.googleapis.com/v1/projects/${projectId}/locations/${location}/publishers/google/models/${API_CONFIG.vertexAI.models.gemini.production}:generateContent`;

        case 'imagen':
            return `https://${location}-aiplatform.googleapis.com/v1/projects/${projectId}/locations/${location}/publishers/google/models/${API_CONFIG.vertexAI.models.imagen.model}:predict`;

        case 'search':
            return `https://discoveryengine.googleapis.com/v1/projects/${projectId}/locations/${location}/collections/default_collection/dataStores/${API_CONFIG.vertexAI.search.dataStoreId}/servingConfigs/default_search:search`;

        default:
            throw new Error(`Unknown service: ${service}`);
    }
}

export default API_CONFIG;
