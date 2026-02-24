import React from "react";
import { BRAND_COLORS } from "@/lib/design-tokens";

export interface ProviderField {
    key: string;
    label: string;
    type: 'text' | 'password' | 'number';
    placeholder?: string;
    required?: boolean;
}

export interface ProviderConfig {
    id: string;
    parentProviderId?: string; // ID del nodo maestro que provee las credenciales
    name: string;
    description: string;
    icon: React.ComponentType<any>;
    color: string;
    category: 'AI' | 'ECOMMERCE' | 'MARKETING' | 'INFRA' | 'LOGISTICS' | 'TOOLS';
    fields: ProviderField[];
    allowMultiple?: boolean;
    unlockedFeatures?: string[];
}

/**
 * ICONOS OFICIALES V10.0 (FIDELIDAD ABSOLUTA 100%)
 * Paths extraídos directamente de Repositorios de Marca (Simple Icons / Wikimedia)
 */

const ShopifyIcon = (props: any) => (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
        <path d="M15.337 23.979l7.216-1.561s-2.604-17.613-2.625-17.73c-.018-.116-.114-.192-.211-.192s-1.929-.136-1.929-.136-1.275-1.274-1.439-1.411c-.045-.037-.075-.057-.121-.074l-.914 21.104h.023zM11.71 11.305s-.81-.424-1.774-.424c-1.447 0-1.504.906-1.504 1.141 0 1.232 3.24 1.715 3.24 4.629 0 2.295-1.44 3.76-3.406 3.76-2.354 0-3.54-1.465-3.54-1.465l.646-2.086s1.245 1.066 2.28 1.066c.675 0 .975-.545.975-.932 0-1.619-2.654-1.694-2.654-4.359-.034-2.237 1.571-4.416 4.827-4.416 1.257 0 1.875.361 1.875.361l-.945 2.715-.02.01zM11.17.83c.136 0 .271.038.405.135-.984.465-2.064 1.639-2.508 3.992-.656.213-1.293.405-1.889.578C7.697 3.75 8.951.84 11.17.84V.83zm1.235 2.949v.135c-.754.232-1.583.484-2.394.736.466-1.777 1.333-2.645 2.085-2.971.193.501.309 1.176.309 2.1zm.539-2.234c.694.074 1.141.867 1.429 1.755-.349.114-.735.231-1.158.366v-.252c0-.752-.096-1.371-.271-1.871v.002zm2.992 1.289c-.02 0-.06.021-.078.021s-.289.075-.714.21c-.423-1.233-1.176-2.37-2.508-2.37h-.115C12.135.209 11.669 0 11.265 0 8.159 0 6.675 3.877 6.21 5.846c-1.194.365-2.063.636-2.16.674-.675.213-.694.232-.772.87-.075.462-1.83 14.063-1.83 14.063L15.009 24l.927-21.166z" />
    </svg>
);

const MetaIcon = (props: any) => (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
        <path d="M6.915 4.03c-1.968 0-3.683 1.28-4.871 3.113C.704 9.208 0 11.883 0 14.449c0 .706.07 1.369.21 1.973a6.624 6.624 0 0 0 .265.86 5.297 5.297 0 0 0 .371.761c.696 1.159 1.818 1.927 3.593 1.927 1.497 0 2.633-.671 3.965-2.444.76-1.012 1.144-1.626 2.663-4.32l.756-1.339.186-.325c.061.1.121.196.183.3l2.152 3.595c.724 1.21 1.665 2.556 2.47 3.314 1.046.987 1.992 1.22 3.06 1.22 1.075 0 1.876-.355 2.455-.843a3.743 3.743 0 0 0 .81-.973c.542-.939.861-2.127.861-3.745 0-2.72-.681-5.357-2.084-7.45-1.282-1.912-2.957-2.93-4.716-2.93-1.047 0-2.088.467-3.053 1.308-.652.57-1.257 1.29-1.82 2.05-.69-.875-1.335-1.547-1.958-2.056-1.182-.966-2.315-1.303-3.454-1.303zm10.16 2.053c1.147 0 2.188.758 2.992 1.999 1.132 1.748 1.647 4.195 1.647 6.4 0 1.548-.368 2.9-1.839 2.9-.58 0-1.027-.23-1.664-1.004-.496-.601-1.343-1.878-2.832-4.358l-.617-1.028a44.908 44.908 0 0 0-1.255-1.98c.07-.109.141-.224.211-.327 1.12-1.667 2.118-2.602 3.358-2.602zm-10.201.553c1.265 0 2.058.791 2.675 1.446.307.327.737.871 1.234 1.579l-1.02 1.566c-.757 1.163-1.882 3.017-2.837 4.338-1.191 1.649-1.81 1.817-2.486 1.817-.524 0-1.038-.237-1.383-.794-.263-.426-.464-1.13-.464-2.046 0-2.221.63-4.535 1.66-6.088.454-.687.964-1.226 1.533-1.533a2.264 2.264 0 0 1 1.088-.285z" />
    </svg>
);

const ClaudeIcon = (props: any) => (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
        <path d="m3.127 10.604 3.135-1.76.053-.153-.053-.085H6.11l-.525-.032-1.791-.048-1.554-.065-1.505-.08-.38-.081L0 7.832l.036-.234.32-.214.455.04 1.009.069 1.513.105 1.097.064 1.626.17h.259l.036-.105-.089-.065-.068-.064-1.566-1.062-1.695-1.121-.887-.646-.48-.327-.243-.306-.104-.67.435-.48.585.04.15.04.593.456 1.267.981 1.654 1.218.242.202.097-.068.012-.049-.109-.181-.9-1.626-.96-1.655-.428-.686-.113-.411a2 2 0 0 1-.068-.484l.496-.674L4.446 0l.662.089.279.242.411.94.666 1.48 1.033 2.014.302.597.162.553.06.17h.105v-.097l.085-1.134.157-1.392.154-1.792.052-.504.25-.605.497-.327.387.186.319.456-.045.294-.19 1.23-.37 1.93-.243 1.29h.142l.161-.16.654-.868 1.097-1.372.484-.545.565-.601.363-.287h.686l.505.751-.226.775-.707.895-.585.759-.839 1.13-.524.904.048.072.125-.012 1.897-.403 1.024-.186 1.223-.21.553.258.06.263-.218.536-1.307.323-1.533.307-2.284.54-.028.02.032.04 1.029.098.44.024h1.077l2.005.15.525.346.315.424-.053.323-.807.411-3.631-.863-.872-.218h-.12v.073l.726.71 1.331 1.202 1.667 1.55.084.383-.214.302-.226-.032-1.464-1.101-.565-.497-1.28-1.077h-.084v.113l.295.432 1.557 2.34.08.718-.112.234-.404.141-.444-.08-.911-1.28-.94-1.44-.759-1.291-.093.053-.448 4.821-.21.246-.484.186-.403-.307-.214-.496.214-.98.258-1.28.21-1.016.19-1.263.112-.42-.008-.028-.092.012-.953 1.307-1.448 1.957-1.146 1.227-.274.109-.477-.247.045-.44.266-.39 1.586-2.018.956-1.25.617-.723-.004-.105h-.036l-4.212 2.736-.75.096-.324-.302.04-.496.154-.162 1.267-.871z" />
    </svg>
);

const ElevenLabsIcon = (props: any) => (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
        <path d="M4.6035 0v24h4.9317V0zm9.8613 0v24h4.9317V0z" />
    </svg>
);

const GeminiIcon = (props: any) => (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
        <path d="M11.04 19.32Q12 21.51 12 24q0-2.49.93-4.68.96-2.19 2.58-3.81t3.81-2.55Q21.51 12 24 12q-2.49 0-4.68-.93a12.3 12.3 0 0 1-3.81-2.58 12.3 12.3 0 0 1-2.58-3.81Q12 2.49 12 0q0 2.49-.96 4.68-.93 2.19-2.55 3.81a12.3 12.3 0 0 1-3.81 2.58Q2.49 12 0 12q2.49 0 4.68.96 2.19.93 3.81 2.55t2.55 3.81" />
    </svg>
);

const ReplicateIcon = (props: any) => (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
        <path d="M24 10.262v2.712h-9.518V24h-3.034V10.262zm0-5.131v2.717H8.755V24H5.722V5.131zM24 0v2.717H3.034V24H0V0z" />
    </svg>
);

const VertexAIIcon = (props: any) => (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
        <path d="M20,13.89A.77.77,0,0,0,19,13.73l-7,5.14v.22a.72.72,0,1,1,0,1.43v0a.74.74,0,0,0,.45-.15l7.41-5.47A.76.76,0,0,0,20,13.89Z M12,20.52a.72.72,0,0,1,0-1.43h0v-.22L5,13.73a.76.76,0,0,0-1,.16.74.74,0,0,0,.16,1l7.41,5.47a.73.73,0,0,0,.44.15v0Z M12,18.34a1.47,1.47,0,1,0,1.47,1.47A1.47,1.47,0,0,0,12,18.34Zm0,2.18a.72.72,0,1,1,.72-.71A.71.71,0,0,1,12,20.52Z" />
    </svg>
);

const GoogleCloudIcon = (props: any) => (
    <img src="https://www.google.com/s2/favicons?domain=cloud.google.com&sz=128" alt="GCP" {...props} />
);

const GoogleAnalyticsIcon = (props: any) => (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
        <path d="M22.84 2.9982v17.9987c.0086 1.6473-1.3197 2.9897-2.967 2.9984a2.9808 2.9808 0 01-.3677-.0208c-1.528-.226-2.6477-1.5558-2.6105-3.1V3.1204c-.0369-1.5458 1.0856-2.8762 2.6157-3.1 1.6361-.1915 3.1178.9796 3.3093 2.6158.014.1201.0208.241.0202.3619zM4.1326 18.0548c-1.6417 0-2.9726 1.331-2.9726 2.9726C1.16 22.6691 2.4909 24 4.1326 24s2.9726-1.3309 2.9726-2.9726-1.331-2.9726-2.9726-2.9726zm7.8728-9.0098c-.0171 0-.0342 0-.0513.0003-1.6495.0904-2.9293 1.474-2.891 3.1256v7.9846c0 2.167.9535 3.4825 2.3505 3.763 1.6118.3266 3.1832-.7152 3.5098-2.327.04-.1974.06-.3983.0593-.5998v-8.9585c.003-1.6474-1.33-2.9852-2.9773-2.9882z" />
    </svg>
);

const BeepingIcon = (props: any) => (
    <img src="https://www.google.com/s2/favicons?domain=gobeeping.com&sz=128" alt="Beeping" {...props} />
);

const DropeaIcon = (props: any) => (
    <img src="https://www.google.com/s2/favicons?domain=dropea.com&sz=128" alt="Dropea" {...props} />
);

const DropiIcon = (props: any) => (
    <img src="https://www.google.com/s2/favicons?domain=dropi.co&sz=128" alt="Dropi" {...props} />
);

export const PROVIDER_REGISTRY: Record<string, ProviderConfig> = {
    SHOPIFY: {
        id: 'SHOPIFY',
        name: 'Shopify Master',
        description: 'Sincronización total: Pedidos, Productos, Clientes y Analítica.',
        icon: ShopifyIcon,
        color: BRAND_COLORS.SHOPIFY,
        category: 'ECOMMERCE',
        allowMultiple: true,
        unlockedFeatures: ['Sync Automática de Pedidos', 'Gestión de Catálogo Completo', 'Perfiles de Clientes & Retención'],
        fields: [
            { key: 'SHOP_NAME', label: 'Nombre de la Tienda', type: 'text', required: true },
            { key: 'SHOPIFY_SHOP_DOMAIN', label: 'Dominio (.myshopify.com)', type: 'text', required: true },
            { key: 'SHOPIFY_ACCESS_TOKEN', label: 'Admin API Token (Scopes Completos)', type: 'password', required: true }
        ]
    },
    META: {
        id: 'META',
        name: 'Meta Ads Suite',
        description: 'Gestión integral de Publicidad, Comentarios y Catálogos.',
        icon: MetaIcon,
        color: BRAND_COLORS.META,
        category: 'MARKETING',
        unlockedFeatures: ['Lectura de Campañas Ads', 'Tracker de ROAS Real', 'Moderación IA de Comentarios', 'Sync de Catálogo'],
        fields: [
            { key: 'META_ACCESS_TOKEN', label: 'User Token Principal', type: 'password', required: true },
            { key: 'META_AD_ACCOUNT_ID', label: 'ID Cuenta Publicitaria', type: 'text', required: true },
            { key: 'META_APP_ID', label: 'ID Aplicación Meta', type: 'text', required: true }
        ]
    },
    REPLICATE: {
        id: 'REPLICATE',
        name: 'Replicate Master Engine',
        description: 'Motor de Video y Avatares PRO (Heygen/CapCut Level).',
        icon: ReplicateIcon,
        color: BRAND_COLORS.ELEVENLABS,
        category: 'AI',
        unlockedFeatures: ['SyncLabs Lip-Sync (Squeezed)', 'Análisis de Video Temporal (Clip a Clip)', 'Conversión Masiva WebM/WebP (FFmpeg)', 'Avatares con Producto Real'],
        fields: [
            { key: 'REPLICATE_API_TOKEN', label: 'Replicate API Token (Master)', type: 'password', required: true }
        ]
    },
    ANTHROPIC: {
        id: 'ANTHROPIC',
        parentProviderId: 'REPLICATE',
        name: 'Claude 3.5 Sonnet',
        description: 'IA de razonamiento superior (vía Replicate).',
        icon: ClaudeIcon,
        color: BRAND_COLORS.ANTHROPIC,
        category: 'AI',
        unlockedFeatures: ['Análisis de Avatar (Research)', 'Generación de Copys Premium', 'Refinamiento de Landing pages'],
        fields: [] // Inherited from REPLICATE
    },
    GOOGLE_CLOUD: {
        id: 'GOOGLE_CLOUD',
        name: 'Google Cloud Platform',
        description: 'Nodo Maestro de Infraestructura y Datos.',
        icon: GoogleCloudIcon,
        color: BRAND_COLORS.GOOGLE,
        category: 'INFRA',
        unlockedFeatures: ['Google Maps & Places', 'Google Sheets', 'Google Drive', 'GA4 Analytics', 'Gmail API', 'Cloud Storage (GCS)', 'BigQuery', 'Vertex AI'],
        fields: [
            { key: 'GOOGLE_CLOUD_PROJECT_ID', label: 'Project ID', type: 'text', required: true },
            { key: 'GOOGLE_CLOUD_LOCATION', label: 'Cloud Location (ej. eu)', type: 'text', required: true },
            { key: 'GCS_BUCKET_NAME', label: 'GCS Bucket Name', type: 'text', required: false },
            { key: 'GOOGLE_SERVICE_ACCOUNT_KEY', label: 'Service Account JSON (Key Maestro)', type: 'password', required: true }
        ]
    },
    VERTEX: {
        id: 'VERTEX',
        parentProviderId: 'GOOGLE_CLOUD',
        name: 'Vertex AI',
        description: 'IA Generativa Enterprise sobre Google Cloud.',
        icon: VertexAIIcon,
        color: BRAND_COLORS.GOOGLE,
        category: 'AI',
        unlockedFeatures: ['Inferencia Enterprise Segura', 'LLMs Avanzados GCP', 'Auto-Traducción Masiva'],
        fields: [] // Inherited from GOOGLE_CLOUD
    },
    GEMINI: {
        id: 'GEMINI',
        name: 'Gemini Pro (Studio)',
        description: 'Google Multimodal AI (vía API Key).',
        icon: GeminiIcon,
        color: BRAND_COLORS.GOOGLE,
        category: 'AI',
        unlockedFeatures: ['Agente Chat Operativo', 'Diagnóstico de Landing Pages', 'Extracción de Datos de Video'],
        fields: [
            { key: 'GEMINI_API_KEY', label: 'API Key (AI Studio)', type: 'password', required: true }
        ]
    },
    GA4: {
        id: 'GA4',
        parentProviderId: 'GOOGLE_CLOUD',
        name: 'Google Analytics 4',
        description: 'Medición avanzada de eventos y BigQuery.',
        icon: GoogleAnalyticsIcon,
        color: BRAND_COLORS.GA4,
        category: 'TOOLS',
        unlockedFeatures: ['Atribución de Tráfico Web', 'Medición de Conversiones', 'Audiencias para Ads'],
        fields: [
            { key: 'GA4_PROPERTY_ID', label: 'GA4 Property ID', type: 'text', required: true }
        ]
    },
    GOOGLE_MAPS: {
        id: 'GOOGLE_MAPS',
        parentProviderId: 'GOOGLE_CLOUD',
        name: 'Google Maps & Places',
        description: 'Geocodificación y validación de direcciones.',
        icon: (props: any) => <img src="https://www.google.com/s2/favicons?domain=maps.google.com&sz=128" alt="Maps" {...props} />,
        color: BRAND_COLORS.GOOGLE,
        category: 'TOOLS',
        unlockedFeatures: ['Autocompletado de Direcciones', 'Validación de Cobertura Logística'],
        fields: [
            { key: 'GOOGLE_MAPS_API_KEY', label: 'API Key de Maps', type: 'password', required: true }
        ]
    },
    CLARITY: {
        id: 'CLARITY',
        name: 'Microsoft Clarity',
        description: 'Grabaciones de sesión y mapas de calor (Heatmaps).',
        icon: (props: any) => <img src="https://www.google.com/s2/favicons?domain=clarity.microsoft.com&sz=128" alt="Clarity" {...props} />,
        color: '#0078D4',
        category: 'TOOLS',
        unlockedFeatures: ['Grabación de Sesiones', 'Análisis de Rabia (Rage Clicks)', 'Heatmaps por Dispositivo'],
        fields: [
            { key: 'CLARITY_PROJECT_ID', label: 'Project ID', type: 'text', required: true }
        ]
    },
    ELEVENLABS: {
        id: 'ELEVENLABS',
        name: 'ElevenLabs Audio',
        description: 'Voz e hilos de audio hiperrealistas.',
        icon: ElevenLabsIcon,
        color: BRAND_COLORS.ELEVENLABS,
        category: 'AI',
        unlockedFeatures: ['Locución de Videos', 'Voces Clonadas (V3)', 'Doblaje Multilingüe'],
        fields: [
            { key: 'ELEVENLABS_API_KEY', label: 'ElevenLabs API Key', type: 'password', required: true }
        ]
    },
    BEEPING: {
        id: 'BEEPING',
        name: 'Beeping Logistics',
        description: '3PL Fulfillment Engine.',
        icon: BeepingIcon,
        color: BRAND_COLORS.BEEPING,
        category: 'LOGISTICS',
        allowMultiple: true,
        unlockedFeatures: ['Fulfillment Automático 3PL', 'Stock en Tiempo Real', 'Tracker de Envíos Externo'],
        fields: [
            { key: 'BEEPING_API_URL', label: 'API Base URL', type: 'text', required: true, placeholder: 'https://app.gobeeping.com/api' },
            { key: 'BEEPING_API_KEY', label: 'API Key', type: 'password', required: true }
        ]
    },
    DROPEA: {
        id: 'DROPEA',
        name: 'Dropea',
        description: 'Gestión logística regional.',
        icon: DropeaIcon,
        color: BRAND_COLORS.DROPEA,
        category: 'LOGISTICS',
        allowMultiple: true,
        unlockedFeatures: ['Gestión de Pedidos COD', 'Rutado Logístico Básico'],
        fields: [
            { key: 'DROPEA_API_KEY', label: 'Dropea API Key', type: 'password', required: true }
        ]
    },
    DROPI: {
        id: 'DROPI',
        name: 'Dropi PRO',
        description: 'Dropshipping y fulfillment masivo.',
        icon: DropiIcon,
        color: BRAND_COLORS.DROPI,
        category: 'LOGISTICS',
        allowMultiple: true,
        unlockedFeatures: ['Catálogo Dropshipping', 'Envío Automático a Proveedor', 'Tracker de Pagos'],
        fields: [
            { key: 'DROPI_API_KEY', label: 'Dropi API Key', type: 'password', required: true }
        ]
    }
};
