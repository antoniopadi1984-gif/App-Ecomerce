// Cascade de modelos de imagen — mejor a peor calidad
const IMAGE_MODELS_CASCADE = [
    'black-forest-labs/flux-1.1-pro',
    'black-forest-labs/flux-dev',
    'black-forest-labs/flux-schnell',
    'ideogram-ai/ideogram-v3',
    'recraft-ai/recraft-v3',
    'stability-ai/stable-diffusion-3.5-large',
];

function buildImageInput(model: string, prompt: string, aspectRatio: string) {
    if (model.includes('flux-1.1-pro') || model.includes('flux-dev') || model.includes('flux-schnell')) {
        return { prompt, aspect_ratio: aspectRatio, num_outputs: 1, output_format: 'webp' };
    }
    if (model.includes('ideogram')) {
        return { prompt, aspect_ratio: aspectRatio === '9:16' ? 'ASPECT_9_16' : aspectRatio === '16:9' ? 'ASPECT_16_9' : 'ASPECT_1_1' };
    }
    if (model.includes('recraft')) {
        return { prompt, size: aspectRatio === '9:16' ? '1024x1820' : aspectRatio === '16:9' ? '1820x1024' : '1024x1024' };
    }
    if (model.includes('stable-diffusion')) {
        return { prompt, aspect_ratio: aspectRatio, num_inference_steps: 28 };
    }
    return { prompt, aspect_ratio: aspectRatio };
}

async function imageRunWithFallback(prompt: string, aspectRatio: string): Promise<string> {
    const token = process.env.REPLICATE_API_TOKEN;
    let lastError = '';

    for (const model of IMAGE_MODELS_CASCADE) {
        try {
            console.log(`[ImageGenerator] 🎯 Intentando: ${model}`);

            let createRes: Response = new Response('{}', { status: 500 });
            let pred: any = {};

            for (let attempt = 1; attempt <= 3; attempt++) {
                createRes = await fetch(
                    `https://api.replicate.com/v1/models/${model}/predictions`,
                    {
                        method: 'POST',
                        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                        body: JSON.stringify({ input: buildImageInput(model, prompt, aspectRatio) }),
                    }
                );
                pred = await createRes.json();

                if (createRes.status === 429) {
                    const waitMs = attempt * 12000;
                    console.warn(`[ImageGenerator] 429 retry ${attempt}/3 en ${waitMs}ms | ${model}`);
                    await new Promise(r => setTimeout(r, waitMs));
                    continue;
                }
                break;
            }

            if (!createRes.ok) {
                lastError = `${model} → ${createRes.status}: ${pred.detail || pred.title}`;
                console.warn(`[ImageGenerator] ⚠️ ${lastError} — siguiente modelo`);
                continue;
            }

            const predId = pred.id;
            console.log(`[ImageGenerator] ▶ ${predId} | ${model}`);

            // Polling
            const start = Date.now();
            while (Date.now() - start < 120000) {
                await new Promise(r => setTimeout(r, 3000));
                const pollRes = await fetch(`https://api.replicate.com/v1/predictions/${predId}`, {
                    headers: { 'Authorization': `Bearer ${token}` },
                });
                const pollData = await pollRes.json();

                if (pollData.status === 'succeeded') {
                    const output = pollData.output;
                    const url = Array.isArray(output) ? output[0] : output;
                    console.log(`[ImageGenerator] ✅ ${model} completado`);
                    return typeof url === 'string' ? url : String(url);
                }
                if (pollData.status === 'failed' || pollData.status === 'canceled') {
                    lastError = `${model} → ${pollData.status}: ${pollData.error}`;
                    console.warn(`[ImageGenerator] ⚠️ ${lastError} — siguiente modelo`);
                    break;
                }
            }
        } catch (err: any) {
            lastError = `${model} → ${err.message}`;
            console.warn(`[ImageGenerator] ⚠️ ${err.message} — siguiente modelo`);
        }
        await new Promise(r => setTimeout(r, 2000));
    }

    throw new Error(`Todos los modelos de imagen fallaron. Último: ${lastError}`);
}

export class ImageGenerator {
    private costPerImage = 0.04;

    async generate(opts: {
        prompt: string;
        aspectRatio: string;
        style?: string;
        imageUrl?: string;
    }): Promise<string> {
        // Si hay imageUrl usar Flux Kontext (image-to-image)
        if (opts.imageUrl) {
            console.log('[ImageGenerator] 🖼️ Image-to-image: flux-kontext-pro');
            const token = process.env.REPLICATE_API_TOKEN;
            let createRes = await fetch(
                'https://api.replicate.com/v1/models/black-forest-labs/flux-kontext-pro/predictions',
                {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                    body: JSON.stringify({ input: { prompt: opts.prompt, input_image: opts.imageUrl } }),
                }
            );
            if (!createRes.ok) {
                // fallback a cascade normal
                return imageRunWithFallback(opts.prompt, opts.aspectRatio);
            }
            const pred = await createRes.json();
            const predId = pred.id;
            const start = Date.now();
            while (Date.now() - start < 120000) {
                await new Promise(r => setTimeout(r, 3000));
                const pollRes = await fetch(`https://api.replicate.com/v1/predictions/${predId}`, {
                    headers: { 'Authorization': `Bearer ${token}` },
                });
                const pollData = await pollRes.json();
                if (pollData.status === 'succeeded') {
                    const output = pollData.output;
                    return Array.isArray(output) ? output[0] : String(output);
                }
                if (pollData.status === 'failed') break;
            }
        }

        return imageRunWithFallback(opts.prompt, opts.aspectRatio);
    }

    async generateBatch(prompts: Array<{ prompt: string; aspectRatio: string; style?: string }>): Promise<string[]> {
        const results: string[] = [];
        for (const p of prompts) {
            results.push(await this.generate(p));
            await new Promise(r => setTimeout(r, 2000));
        }
        return results;
    }

    calculateCost(count: number): number { return count * this.costPerImage; }
}
