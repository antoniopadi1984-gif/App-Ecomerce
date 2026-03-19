import { spawn } from 'child_process';
import { writeFile, unlink, mkdir, readFile } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';
import { randomBytes } from 'crypto';

interface AssemblyOptions {
    scenes: string[]; // Paths or URLs to scene videos
    voiceUrl: string; // Master voice
    musicUrl?: string; // Background music
    musicVolume?: number; // Default 0.22
    scribeData?: any; // ElevenLabs Scribe V2 data (word timestamps)
    outputFormat?: '9:16' | '4:5' | '1:1'; // Default 9:16
    nomenclature?: string; // Final filename
}

export class VideoAssemblyPipeline {
    /**
     * MASTER ASSEMBLY - Executes the full pipeline to generate the final creative
     */
    static async assemble(options: AssemblyOptions): Promise<{ success: boolean; buffer?: Buffer; error?: string }> {
        const id = randomBytes(8).toString('hex');
        const tempDir = join(tmpdir(), `ecombom-assembly-${id}`);
        await mkdir(tempDir, { recursive: true });

        try {
            console.log(`[Assembly] 🚀 Starting assembly: ${options.nomenclature}`);

            // 1. Download/Prepare all assets
            const sceneFiles = await this.prepareAssets(options.scenes, tempDir, 'scene');
            const voiceFile = await this.prepareAsset(options.voiceUrl, tempDir, 'voice');
            const musicFile = options.musicUrl ? await this.prepareAsset(options.musicUrl, tempDir, 'music') : null;

            // 2. Step 1: Concat Scenes
            const concatOutput = join(tempDir, 'concat.mp4');
            await this.concatScenes(sceneFiles, concatOutput);

            // 3. Step 2: Mix Audio
            const mixedOutput = join(tempDir, 'mixed.mp4');
            await this.mixAudio(concatOutput, voiceFile, musicFile, options.musicVolume || 0.22, mixedOutput);

            // 4. Step 3: Burn Subtitles (if scribeData provide)
            let subbedOutput = mixedOutput;
            if (options.scribeData) {
                const assFile = join(tempDir, 'subs.ass');
                await this.generateAssFile(options.scribeData, assFile);
                subbedOutput = join(tempDir, 'subbed.mp4');
                await this.burnSubtitles(mixedOutput, assFile, subbedOutput);
            }

            // 5. Steps 4 & 5: Format & Strip Metadata
            const finalOutput = join(tempDir, 'final.mp4');
            await this.finalizeVideo(subbedOutput, options.outputFormat || '9:16', finalOutput);

            // Read final buffer
            const finalBuffer = await readFile(finalOutput);

            // Cleanup
            // await this.cleanup(tempDir); // Keep for now if needed for debugging

            return { success: true, buffer: finalBuffer };
        } catch (error: any) {
            console.error('[Assembly] ❌ Pipeline Error:', error);
            return { success: false, error: error.message };
        }
    }

    private static async prepareAssets(urls: string[], tempDir: string, prefix: string): Promise<string[]> {
        const paths: string[] = [];
        for (let i = 0; i < urls.length; i++) {
            paths.push(await this.prepareAsset(urls[i], tempDir, `${prefix}_${i}`));
        }
        return paths;
    }

    private static async prepareAsset(url: string, tempDir: string, name: string): Promise<string> {
        const ext = url.split('.').pop()?.split('?')[0] || (name.includes('voice') ? 'mp3' : 'mp4');
        const targetPath = join(tempDir, `${name}.${ext}`);

        if (url.startsWith('http')) {
            const buf = await fetch(url).then(r => r.arrayBuffer());
            await writeFile(targetPath, Buffer.from(buf));
        } else {
            // Assume local path, copy it (simplified)
            const buf = await readFile(url);
            await writeFile(targetPath, buf);
        }
        return targetPath;
    }

    /**
     * PASO 1: Unir clips
     */
    private static async concatScenes(files: string[], output: string): Promise<void> {
        const inputs = files.flatMap(f => ['-i', f]);
        const filter = files.map((_, i) => `[${i}:v][${i}:a]`).join('') + `concat=n=${files.length}:v=1:a=1[v][a]`;

        await this.runFfmpeg([
            ...inputs,
            '-filter_complex', filter,
            '-map', '[v]', '-map', '[a]',
            output
        ]);
    }

    /**
     * PASO 2: Mezclar audio maestro (voz) + música de fondo
     */
    private static async mixAudio(videoIn: string, voiceIn: string, musicIn: string | null, musicVol: number, output: string): Promise<void> {
        const inputs = ['-i', videoIn, '-i', voiceIn];
        if (musicIn) inputs.push('-i', musicIn);

        let filter = '';
        if (musicIn) {
            filter = `[1:a]volume=1.0[voz];[2:a]volume=${musicVol}[musica];[voz][musica]amix=inputs=2:duration=longest[audio_final]`;
        } else {
            filter = `[1:a]volume=1.0[audio_final]`;
        }

        await this.runFfmpeg([
            ...inputs,
            '-filter_complex', filter,
            '-map', '0:v',
            '-map', '[audio_final]',
            output
        ]);
    }

    /**
     * PASO 3: Generar archivo .ass y quemar subtítulos
     */
    private static async generateAssFile(scribeData: any, outputPath: string): Promise<void> {
        // scribeData structure from ElevenLabs Scribe V2 (word level)
        // Assume: { words: [{ text: "Hello", start: 0, end: 0.5 }, ...] }
        const words = scribeData.words || [];

        // Style: Impact, blanco con contorno negro, parte inferior (Alignment 2)
        let assContent = `[Script Info]
ScriptType: v4.00+
PlayResX: 720
PlayResY: 1280

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Default,Impact,80,&H00FFFFFF,&H000000FF,&H00000000,&H00000000,-1,0,0,0,100,100,0,0,1,4,0,2,30,30,120,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
`;

        // Combine words into short phrases (optional but better for readability)
        // For now, word-by-word as requested
        // Checking ElevenLabs docs: Scribe V2 returns seconds.
        for (const word of words) {
            const start = this.formatAssTime(word.start);
            const end = this.formatAssTime(word.end);
            assContent += `Dialogue: 0,${start},${end},Default,,0,0,0,,${word.text}\n`;
        }

        await writeFile(outputPath, assContent);
    }

    private static formatAssTime(seconds: number): string {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = (seconds % 60).toFixed(2);
        return `${h}:${m.toString().padStart(2, '0')}:${s.padStart(5, '0')}`;
    }

    private static async burnSubtitles(videoIn: string, assFile: string, output: string): Promise<void> {
        await this.runFfmpeg([
            '-i', videoIn,
            '-vf', `ass=${assFile}`,
            output
        ]);
    }

    /**
     * PASO 4 & 5: Strip metadata y Reencuadre
     */
    private static async finalizeVideo(videoIn: string, format: string, output: string): Promise<void> {
        let vf = '';
        if (format === '4:5') {
            vf = 'scale=720:900:force_original_aspect_ratio=increase,crop=720:900';
        } else if (format === '1:1') {
            vf = 'scale=720:720:force_original_aspect_ratio=increase,crop=720:720';
        } else {
            vf = 'scale=720:1280'; // Force typical 9:16
        }

        await this.runFfmpeg([
            '-i', videoIn,
            '-map_metadata', '-1',
            '-vf', vf,
            '-c:v', 'libx264',
            '-crf', '20',
            '-preset', 'medium',
            '-c:a', 'aac',
            '-b:a', '192k',
            output
        ]);
    }

    private static async runFfmpeg(args: string[]): Promise<void> {
        return new Promise((resolve, reject) => {
            const ff = spawn('ffmpeg', ['-y', ...args]);
            let stderr = '';
            ff.stderr.on('data', (d) => stderr += d);
            ff.on('close', (code) => {
                if (code === 0) resolve();
                else reject(new Error(`FFmpeg error (${code}): ${stderr}`));
            });
            ff.on('error', reject);
        });
    }
}
