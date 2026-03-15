import { getConnectionSecret } from '@/lib/server/connections';
import Replicate from 'replicate';

const MODELS = {
    STANDARD: 'zsxkib/mmaudio:4b9f801a0cfe7c8c17fa68a56bb1a5b60a3d8b8c3c14c7af5bee1c39649f3936',
    PREMIUM:  'lucataco/omni-human:latest'
};

export class VideoAnimator {
    async animate(opts: {
        imageUrl: string;
        audioUrl: string;
        cropFactor?: number;
        quality?: 'standard' | 'premium';
    }): Promise<string> {
        const token = await getConnectionSecret('store-main', 'REPLICATE');
        const replicate = new Replicate({ auth: token! });

        const model = opts.quality === 'premium' ? MODELS.PREMIUM : MODELS.STANDARD;

        const output = await replicate.run(model as any, {
            input: {
                video: opts.imageUrl,
                audio: opts.audioUrl,
                output_format: 'mp4',
                crop_factor: opts.cropFactor || 1.0
            }
        });

        return Array.isArray(output) ? output[0] : output as string;
    }
}
