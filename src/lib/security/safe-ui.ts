/**
 * Guard anti-regresión: lista de strings secretos que NUNCA deben aparecer en UI.
 * Si alguien construye un label/message que contenga un nombre de variable,
 * esta función lo detecta y lo reemplaza por un texto seguro.
 */

const BLOCKED_SECRETS = [
    "BRAVE_API_KEY",
    "EXA_API_KEY",
    "TAVILY_API_KEY",
    "SHOPIFY_ACCESS_TOKEN",
    "SHOPIFY_SHOP_DOMAIN",
    "ANTHROPIC_API_KEY",
    "REPLICATE_API_TOKEN",
    "GOOGLE_SERVICE_ACCOUNT_KEY",
    "META_ACCESS_TOKEN",
    "META_APP_SECRET",
    "BEEPING_API_KEY",
    "OPENAI_API_KEY",
    "ELEVENLABS_API_KEY",
    "STRIPE_SECRET_KEY",
    "STRIPE_WEBHOOK_SECRET",
    "DATABASE_URL",
    "NEXTAUTH_SECRET",
] as const;

/**
 * Sanitiza un texto sustituyendo cualquier nombre de variable secreta
 * por "***" para evitar fugas en UI.
 * 
 * @example
 * sanitizeForUI("Falta SHOPIFY_ACCESS_TOKEN en .env")
 * // → "Falta *** en .env"
 */
export function sanitizeForUI(text: string): string {
    let result = text;
    for (const secret of BLOCKED_SECRETS) {
        if (result.includes(secret)) {
            result = result.replaceAll(secret, "***");
        }
    }
    return result;
}

/**
 * Valida que un texto NO contenga nombres de variables secretas.
 * Retorna true si es seguro, false si contiene algún secreto.
 */
export function isSecureForUI(text: string): boolean {
    return !BLOCKED_SECRETS.some((s) => text.includes(s));
}

/**
 * Lista de nombres de secretos bloqueados (para uso en tests o validación).
 */
export const BLOCKED_SECRET_NAMES = [...BLOCKED_SECRETS];

/**
 * Mapeo de nombres de env var a labels amigables para el usuario.
 * Esto permite que los mensajes de error sean útiles SIN revelar secretos.
 */
export const SAFE_LABELS: Record<string, string> = {
    SHOPIFY_ACCESS_TOKEN: "credenciales de Shopify",
    SHOPIFY_SHOP_DOMAIN: "dominio de Shopify",
    META_ACCESS_TOKEN: "token de Meta/Facebook",
    BEEPING_API_KEY: "credenciales de Beeping",
    GOOGLE_SERVICE_ACCOUNT_KEY: "cuenta de servicio de Google",
    REPLICATE_API_TOKEN: "token de Replicate",
    BRAVE_API_KEY: "API de búsqueda web",
    EXA_API_KEY: "API de búsqueda Exa",
    TAVILY_API_KEY: "API de búsqueda Tavily",
    ANTHROPIC_API_KEY: "credenciales de Claude AI",
};

/**
 * Genera un mensaje de error seguro para falta de configuración.
 * En vez de "Falta SHOPIFY_ACCESS_TOKEN en .env" dice
 * "Falta configurar credenciales de Shopify"
 */
export function safeConfigError(envVar: string): string {
    const label = SAFE_LABELS[envVar] || "configuración requerida";
    return `Falta configurar ${label}`;
}
