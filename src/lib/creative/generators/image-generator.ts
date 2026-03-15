import { getConnectionSecret } from '@/lib/server/connections';
import Replicate from 'replicate';

export class ImageGenerator {
    private costPerImage = 0.055;
    private generatedCount = 0;

    async generate(opts: {
        prompt: string;
        aspectRatio: string;
        style: string;
        imageUrl?: string; // Para image-to-image con Flux Kontext
    }): Promise<string> {
        const token = await getConnectionSecret('store-main', 'REPLICATE');
        const replicate = new Replicate({ auth: token! });

        const model = opts.imageUrl
            ? 'black-forest-labs/flux-kontext-pro'  // image-to-image
            : 'black-forest-labs/flux-1.1-pro';     // text-to-image

        const input: any = {
            prompt: opts.prompt,
            aspect_ratio: opts.aspectRatio || '9:16',
        };
        if (opts.imageUrl) input.input_image = opts.imageUrl;

        const output = await replicate.run(model as any, { input });
        this.generatedCount++;
        return (Array.isArray(output) ? output[0] : output) as string;
    }

    async generateBatch(configs: { prompt: string; aspectRatio: string; style: string; imageUrl?: string }[]): Promise<string[]> {
        return Promise.all(configs.map(c => this.generate(c)));
    }

    calculateCost(count: number): number {
        return count * this.costPerImage;
    }

    getTotalCost(): number {
        return this.generatedCount * this.costPerImage;
    }
}
