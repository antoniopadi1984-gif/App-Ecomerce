export const ANALYTICS_CONFIG: Record<string, {
    ga4MeasurementId: string;
    ga4PropertyId: string;
    clarityProjectId: string;
    clarityToken: string;
    storeUrl: string;
}> = {
    'store-main': {
        ga4MeasurementId: process.env.GA4_MEASUREMENT_ID_STORE_MAIN || '',
        ga4PropertyId:    process.env.GA4_PROPERTY_ID_STORE_MAIN    || '',
        clarityProjectId: process.env.CLARITY_PROJECT_ALEESSENCE    || '',
        clarityToken:     process.env.CLARITY_TOKEN_ALEESSENCE      || '',
        storeUrl:         'https://aleessence.es',
    },
    'alecare-mx': {
        ga4MeasurementId: process.env.GA4_MEASUREMENT_ID_ALECARE_MX || '',
        ga4PropertyId:    process.env.GA4_PROPERTY_ID_ALECARE_MX    || '',
        clarityProjectId: process.env.CLARITY_PROJECT_ALECARE_MX    || '',
        clarityToken:     process.env.CLARITY_TOKEN_ALECARE_MX      || '',
        storeUrl:         'https://alecare.es',
    },
    'store-alecare-uk': {
        ga4MeasurementId: process.env.GA4_MEASUREMENT_ID_ALECARE_UK || '',
        ga4PropertyId:    process.env.GA4_PROPERTY_ID_ALECARE_UK    || '',
        clarityProjectId: process.env.CLARITY_PROJECT_ALECARE_UK    || '',
        clarityToken:     process.env.CLARITY_TOKEN_ALECARE_UK      || '',
        storeUrl:         'https://alecareshop.com',
    },
};

export function getAnalyticsConfig(storeId: string) {
    return ANALYTICS_CONFIG[storeId] || null;
}
