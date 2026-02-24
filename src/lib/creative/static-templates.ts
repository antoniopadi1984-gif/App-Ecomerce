/**
 * STATIC AD TEMPLATES - ENVATO PREMIUM STYLE
 * High-conversion templates with modern design elements
 */

export interface StaticAdTemplate {
    id: string;
    name: string;
    category: 'product' | 'testimonial' | 'comparison' | 'ugc' | 'educational' | 'pain_point' | 'limited_offer';
    funnelStage: 'COLD' | 'WARM' | 'HOT';
    dimensions: string;
    layout: TemplateLayout;
}

export interface TemplateLayout {
    background: BackgroundConfig;
    elements: TemplateElement[];
    fonts?: FontConfig;
    colors?: ColorConfig;
}

interface BackgroundConfig {
    type: 'solid' | 'gradient' | 'image';
    value?: string | string[];
    gradient?: {
        angle: number;
        stops: Array<{ color: string; position: number }>;
    };
    overlay?: {
        type: string;
        opacity: number;
        pattern?: string;
    };
}

interface TemplateElement {
    id?: string;
    type: 'text' | 'image' | 'shape' | 'icon' | 'cta';
    content?: string;
    placeholder?: string;
    source?: string;
    shape?: 'rectangle' | 'circle' | 'triangle';
    position: { x: number; y: number };
    size: { width: number; height: number };
    style?: any;
}

interface FontConfig {
    primary: string;
    secondary: string;
}

interface ColorConfig {
    primary: string;
    secondary: string;
    accent: string;
    text: string;
    background: string;
}

/**
 * Pre-built PREMIUM templates (Envato-inspired)
 */
export const STATIC_AD_TEMPLATES: StaticAdTemplate[] = [
    // COLD - Pain Point Bold Premium
    {
        id: 'pain_point_premium_1',
        name: 'Pain Point Bold Premium',
        category: 'pain_point',
        funnelStage: 'COLD',
        dimensions: '1080x1920',
        layout: {
            background: {
                type: 'gradient',
                gradient: {
                    angle: 135,
                    stops: [
                        { color: 'var(--slate-900)', position: 0 },
                        { color: 'var(--slate-800)', position: 100 }
                    ]
                }
            },
            elements: [
                {
                    type: 'shape',
                    shape: 'rectangle',
                    position: { x: 0, y: 0 },
                    size: { width: 1080, height: 8 },
                    style: { backgroundColor: 'var(--primary)' }
                },
                {
                    type: 'text',
                    placeholder: 'painPoint',
                    content: '{{pain_point}}',
                    position: { x: 80, y: 280 },
                    size: { width: 920, height: 400 },
                    style: {
                        fontSize: 68,
                        fontWeight: '900',
                        color: 'var(--white)',
                        textAlign: 'left',
                        lineHeight: 1.15,
                        textShadow: '0 4px 20px rgba(0,0,0,0.4)'
                    }
                },
                {
                    type: 'text',
                    placeholder: 'productName',
                    content: '{{product_name}}',
                    position: { x: 120, y: 950 },
                    size: { width: 840, height: 120 },
                    style: {
                        fontSize: 52,
                        fontWeight: '800',
                        color: 'var(--white)',
                        textAlign: 'center'
                    }
                },
                {
                    type: 'shape',
                    shape: 'rectangle',
                    position: { x: 240, y: 1450 },
                    size: { width: 600, height: 100 },
                    style: {
                        background: 'linear-gradient(135deg, var(--primary), var(--accent-strong))',
                        borderRadius: 50,
                        boxShadow: '0 10px 40px var(--primary-shadow)'
                    }
                },
                {
                    type: 'cta',
                    content: 'Ver Solución →',
                    position: { x: 240, y: 1450 },
                    size: { width: 600, height: 100 },
                    style: {
                        fontSize: 36,
                        fontWeight: '700',
                        color: 'var(--white)',
                        textAlign: 'center'
                    }
                }
            ]
        }
    },

    // WARM - Product Hero Premium
    {
        id: 'product_hero_premium',
        name: 'Product Hero Premium',
        category: 'product',
        funnelStage: 'WARM',
        dimensions: '1080x1920',
        layout: {
            background: {
                type: 'gradient',
                gradient: {
                    angle: 180,
                    stops: [
                        { color: 'var(--slate-50)', position: 0 },
                        { color: 'var(--white)', position: 100 }
                    ]
                }
            },
            elements: [
                {
                    type: 'image',
                    placeholder: 'productImage',
                    source: '{{product_image}}',
                    position: { x: 190, y: 350 },
                    size: { width: 700, height: 700 },
                    style: { objectFit: 'contain', borderRadius: 20 }
                },
                {
                    type: 'text',
                    content: '★★★★★ 4.9',
                    position: { x: 60, y: 1180 },
                    size: { width: 960, height: 60 },
                    style: { fontSize: 40, color: 'var(--alert-warning)', textAlign: 'center' }
                },
                {
                    type: 'text',
                    placeholder: 'productName',
                    content: '{{product_name}}',
                    position: { x: 80, y: 1340 },
                    size: { width: 920, height: 120 },
                    style: {
                        fontSize: 62,
                        fontWeight: '900',
                        color: 'var(--primary)',
                        textAlign: 'center'
                    }
                },
                {
                    type: 'shape',
                    shape: 'rectangle',
                    position: { x: 190, y: 1680 },
                    size: { width: 700, height: 110 },
                    style: {
                        background: 'linear-gradient(135deg, var(--alert-info), var(--primary))',
                        borderRadius: 55,
                        boxShadow: '0 15px 50px var(--info-shadow)'
                    }
                },
                {
                    type: 'cta',
                    content: 'Comprar Ahora',
                    position: { x: 190, y: 1680 },
                    size: { width: 700, height: 110 },
                    style: {
                        fontSize: 38,
                        fontWeight: '700',
                        color: 'var(--white)',
                        textAlign: 'center'
                    }
                }
            ]
        }
    },

    // HOT - Limited Offer Premium
    {
        id: 'limited_offer_premium',
        name: 'Limited Offer Premium',
        category: 'limited_offer',
        funnelStage: 'HOT',
        dimensions: '1080x1920',
        layout: {
            background: {
                type: 'gradient',
                gradient: {
                    angle: 135,
                    stops: [
                        { color: 'var(--primary)', position: 0 },
                        { color: 'var(--accent-strong)', position: 100 }
                    ]
                }
            },
            elements: [
                {
                    type: 'text',
                    content: 'OFERTA LIMITADA',
                    position: { x: 60, y: 120 },
                    size: { width: 960, height: 100 },
                    style: {
                        fontSize: 44,
                        fontWeight: '900',
                        color: 'var(--white)',
                        textAlign: 'center',
                        letterSpacing: '0.1em'
                    }
                },
                {
                    type: 'shape',
                    shape: 'rectangle',
                    position: { x: 180, y: 300 },
                    size: { width: 720, height: 400 },
                    style: {
                        backgroundColor: 'rgba(255,255,255,0.2)',
                        borderRadius: 30,
                        backdropFilter: 'blur(10px)',
                        border: '3px solid rgba(255,255,255,0.3)'
                    }
                },
                {
                    type: 'text',
                    content: '-50%',
                    position: { x: 180, y: 320 },
                    size: { width: 720, height: 240 },
                    style: {
                        fontSize: 160,
                        fontWeight: '900',
                        color: 'var(--white)',
                        textAlign: 'center',
                        textShadow: '0 10px 30px rgba(0,0,0,0.3)'
                    }
                },
                {
                    type: 'text',
                    content: 'SOLO POR HOY',
                    position: { x: 180, y: 580 },
                    size: { width: 720, height: 80 },
                    style: {
                        fontSize: 36,
                        fontWeight: '700',
                        color: 'var(--white)',
                        textAlign: 'center'
                    }
                },
                {
                    type: 'text',
                    placeholder: 'productName',
                    content: '{{product_name}}',
                    position: { x: 80, y: 850 },
                    size: { width: 920, height: 180 },
                    style: {
                        fontSize: 56,
                        fontWeight: '800',
                        color: 'var(--white)',
                        textAlign: 'center',
                        lineHeight: 1.2
                    }
                },
                {
                    type: 'shape',
                    shape: 'rectangle',
                    position: { x: 140, y: 1500 },
                    size: { width: 800, height: 120 },
                    style: {
                        backgroundColor: 'var(--white)',
                        borderRadius: 60,
                        boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
                    }
                },
                {
                    type: 'cta',
                    content: 'COMPRAR AHORA →',
                    position: { x: 140, y: 1500 },
                    size: { width: 800, height: 120 },
                    style: {
                        fontSize: 42,
                        fontWeight: '900',
                        color: 'var(--accent-strong)',
                        textAlign: 'center'
                    }
                }
            ]
        }
    },

    // WARM - Testimonial Premium
    {
        id: 'testimonial_premium',
        name: 'Customer Review Premium',
        category: 'testimonial',
        funnelStage: 'WARM',
        dimensions: '1080x1920',
        layout: {
            background: {
                type: 'solid',
                value: 'var(--bg)'
            },
            elements: [
                {
                    type: 'text',
                    content: '★★★★★',
                    position: { x: 60, y: 200 },
                    size: { width: 960, height: 100 },
                    style: {
                        fontSize: 72,
                        color: 'var(--alert-warning)',
                        textAlign: 'center'
                    }
                },
                {
                    type: 'shape',
                    shape: 'rectangle',
                    position: { x: 120, y: 380 },
                    size: { width: 840, height: 600 },
                    style: {
                        backgroundColor: 'var(--white)',
                        borderRadius: 30,
                        boxShadow: '0 20px 60px rgba(0,0,0,0.08)',
                        padding: 60
                    }
                },
                {
                    type: 'text',
                    placeholder: 'testimonial',
                    content: '"{{testimonial_text}}"',
                    position: { x: 180, y: 450 },
                    size: { width: 720, height: 400 },
                    style: {
                        fontSize: 36,
                        fontWeight: '500',
                        color: 'var(--text)',
                        textAlign: 'center',
                        lineHeight: 1.6,
                        fontStyle: 'italic'
                    }
                },
                {
                    type: 'text',
                    content: '- María G.',
                    position: { x: 180, y: 870 },
                    size: { width: 720, height: 60 },
                    style: {
                        fontSize: 28,
                        fontWeight: '700',
                        color: 'var(--muted-text)',
                        textAlign: 'center'
                    }
                },
                {
                    type: 'text',
                    placeholder: 'productName',
                    content: '{{product_name}}',
                    position: { x: 80, y: 1140 },
                    size: { width: 920, height: 140 },
                    style: {
                        fontSize: 52,
                        fontWeight: '900',
                        color: 'var(--slate-900)',
                        textAlign: 'center'
                    }
                },
                {
                    type: 'shape',
                    shape: 'rectangle',
                    position: { x: 240, y: 1540 },
                    size: { width: 600, height: 100 },
                    style: {
                        background: 'linear-gradient(135deg, var(--alert-info), var(--primary))',
                        borderRadius: 50,
                        boxShadow: '0 10px 40px rgba(59, 130, 246, 0.4)'
                    }
                },
                {
                    type: 'cta',
                    content: 'Probar Ahora',
                    position: { x: 240, y: 1540 },
                    size: { width: 600, height: 100 },
                    style: {
                        fontSize: 36,
                        fontWeight: '700',
                        color: 'var(--white)',
                        textAlign: 'center'
                    }
                }
            ]
        }
    },

    // WARM - Before/After Comparison Premium
    {
        id: 'comparison_premium',
        name: 'Before After Premium',
        category: 'comparison',
        funnelStage: 'WARM',
        dimensions: '1080x1920',
        layout: {
            background: {
                type: 'solid',
                value: 'var(--white)'
            },
            elements: [
                {
                    type: 'text',
                    content: 'TRANSFORMACIÓN REAL',
                    position: { x: 60, y: 120 },
                    size: { width: 960, height: 80 },
                    style: {
                        fontSize: 40,
                        fontWeight: '900',
                        color: 'var(--slate-900)',
                        textAlign: 'center',
                        letterSpacing: '0.05em'
                    }
                },
                // BEFORE section
                {
                    type: 'shape',
                    shape: 'rectangle',
                    position: { x: 60, y: 280 },
                    size: { width: 960, height: 550 },
                    style: {
                        backgroundColor: 'var(--accent-pastel)',
                        borderRadius: 20,
                        border: '3px solid var(--primary)'
                    }
                },
                {
                    type: 'text',
                    content: 'ANTES',
                    position: { x: 60, y: 300 },
                    size: { width: 960, height: 60 },
                    style: {
                        fontSize: 32,
                        fontWeight: '800',
                        color: 'var(--alert-critical)',
                        textAlign: 'center'
                    }
                },
                {
                    type: 'image',
                    placeholder: 'beforeImage',
                    source: '{{before_image}}',
                    position: { x: 160, y: 380 },
                    size: { width: 760, height: 400 },
                    style: { objectFit: 'cover', borderRadius: 15 }
                },
                // AFTER section
                {
                    type: 'shape',
                    shape: 'rectangle',
                    position: { x: 60, y: 900 },
                    size: { width: 960, height: 550 },
                    style: {
                        backgroundColor: 'rgba(16, 185, 129, 0.05)',
                        borderRadius: 20,
                        border: '3px solid var(--alert-ok)'
                    }
                },
                {
                    type: 'text',
                    content: 'DESPUÉS',
                    position: { x: 60, y: 920 },
                    size: { width: 960, height: 60 },
                    style: {
                        fontSize: 32,
                        fontWeight: '800',
                        color: 'var(--alert-ok)',
                        textAlign: 'center'
                    }
                },
                {
                    type: 'image',
                    placeholder: 'afterImage',
                    source: '{{after_image}}',
                    position: { x: 160, y: 1000 },
                    size: { width: 760, height: 400 },
                    style: { objectFit: 'cover', borderRadius: 15 }
                },
                {
                    type: 'shape',
                    shape: 'rectangle',
                    position: { x: 190, y: 1600 },
                    size: { width: 700, height: 110 },
                    style: {
                        background: 'linear-gradient(135deg, var(--alert-ok), var(--primary))',
                        borderRadius: 55,
                        boxShadow: '0 15px 50px rgba(16, 185, 129, 0.35)'
                    }
                },
                {
                    type: 'cta',
                    content: 'Logra Tu Transformación',
                    position: { x: 190, y: 1600 },
                    size: { width: 700, height: 110 },
                    style: {
                        fontSize: 34,
                        fontWeight: '700',
                        color: 'var(--white)',
                        textAlign: 'center'
                    }
                }
            ]
        }
    }
];

/**
 * COLOR SCHEMES for template variants
 */
export const COLOR_SCHEMES = [
    { name: 'Ocean Blue', primary: '#0ea5e9', secondary: '#0284c7', accent: '#38bdf8' },
    { name: 'Sunset Orange', primary: '#f97316', secondary: '#ea580c', accent: '#fb923c' },
    { name: 'Forest Green', primary: '#10b981', secondary: '#059669', accent: '#34d399' },
    { name: 'Royal Purple', primary: '#a855f7', secondary: '#9333ea', accent: '#c084fc' },
    { name: 'Pink Flamingo', primary: '#ec4899', secondary: '#db2777', accent: '#f472b6' }
];

/**
 * Generate color variants of a template
 */
export function generateTemplateVariants(
    baseTemplate: StaticAdTemplate,
    colorSchemes: typeof COLOR_SCHEMES
): StaticAdTemplate[] {
    return colorSchemes.map((scheme, index) => ({
        ...baseTemplate,
        id: `${baseTemplate.id}_${scheme.name.toLowerCase().replace(/ /g, '_')}`,
        name: `${baseTemplate.name} - ${scheme.name}`,
        layout: {
            ...baseTemplate.layout,
            background: {
                ...baseTemplate.layout.background,
                gradient: baseTemplate.layout.background.gradient ? {
                    ...baseTemplate.layout.background.gradient,
                    stops: baseTemplate.layout.background.gradient.stops.map((stop, i) => ({
                        ...stop,
                        color: i === 0 ? scheme.primary : scheme.secondary
                    }))
                } : undefined
            }
        }
    }));
}
