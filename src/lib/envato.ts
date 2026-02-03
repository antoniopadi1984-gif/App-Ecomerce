"use server";

// --- ENVATO ASSETS SERVICE ---
// Interface to browse backgrounds, videos and music for the Studio

export interface EnvatoAsset {
    id: string;
    title: string;
    thumbnail_url: string;
    preview_url?: string;
    type: 'VIDEO' | 'IMAGE' | 'AUDIO';
    tags: string[];
}

export async function searchEnvatoAssets(query: string, type: 'VIDEO' | 'IMAGE' | 'AUDIO' = 'VIDEO'): Promise<EnvatoAsset[]> {
    // In a real scenario, this would call Envato API with an API Key
    // Mocking results for the Studio experience

    const mocks: Record<string, EnvatoAsset[]> = {
        'VIDEO': [
            { id: 'v1', title: 'Modern Clean Office', thumbnail_url: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80&w=400', type: 'VIDEO', tags: ['office', 'pro'] },
            { id: 'v2', title: 'Cyberpunk Neon Street', thumbnail_url: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&q=80&w=400', type: 'VIDEO', tags: ['neon', 'future'] },
            { id: 'v3', title: 'Luxury Living Room', thumbnail_url: 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&q=80&w=400', type: 'VIDEO', tags: ['luxury', 'interior'] },
            { id: 'v4', title: 'Fitness Gym Background', thumbnail_url: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&q=80&w=400', type: 'VIDEO', tags: ['fitness', 'energy'] },
        ],
        'IMAGE': [
            { id: 'i1', title: 'Minimalist Studio', thumbnail_url: 'https://images.unsplash.com/photo-1542744094-24638eff58bb?auto=format&fit=crop&q=80&w=400', type: 'IMAGE', tags: ['studio', 'white'] },
            { id: 'i2', title: 'Tech Command Center', thumbnail_url: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&q=80&w=400', type: 'IMAGE', tags: ['tech', 'dark'] },
        ]
    };

    return mocks[type] || [];
}

export async function getTrendingAssets(): Promise<EnvatoAsset[]> {
    return [
        { id: 't1', title: 'Abstract Neural Network', thumbnail_url: 'https://images.unsplash.com/photo-1620712943543-bcc4628c6757?auto=format&fit=crop&q=80&w=400', type: 'VIDEO', tags: ['ai', 'abstract'] },
        { id: 't2', title: 'E-commerce Package 3D', thumbnail_url: 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?auto=format&fit=crop&q=80&w=400', type: 'IMAGE', tags: ['shopping', 'delivery'] },
    ];
}
