import { exec } from "child_process";
import { promisify } from "util";
import path from "path";
import fs from "fs/promises";
import os from "os";

const execAsync = promisify(exec);

export interface CourseSegment {
    imagePath: string;
    audioPath?: string;
    text: string;
    duration?: number;
}

export class CourseEngine {
    private static UPLOADS_DIR = path.join(process.cwd(), "public", "uploads", "contents");

    /**
     * Assemblies a series of segments into a final MP4 mini-course.
     */
    static async assembleMiniCourse(courseId: string, segments: CourseSegment[]) {
        const tempFiles: string[] = [];
        const workDir = await fs.mkdtemp(path.join(os.tmpdir(), "course-build-"));

        try {
            await fs.mkdir(this.UPLOADS_DIR, { recursive: true });

            // 1. Process each segment into a temp video part
            for (let i = 0; i < segments.length; i++) {
                const seg = segments[i];
                const partPath = path.join(workDir, `part_${i}.ts`); // Use MPEG-TS for easier concat
                const duration = seg.duration || 8;

                let cmd = "";
                if (seg.audioPath) {
                    // With Audio: Loop image for audio duration
                    cmd = `ffmpeg -loop 1 -i "${seg.imagePath}" -i "${seg.audioPath}" -t ${duration} -vf "scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,drawtext=text='${seg.text}':fontcolor=white:fontsize=48:x=(w-text_w)/2:y=h-400:box=1:boxcolor=black@0.5:boxborderw=10" -c:v libx264 -c:a aac -shortest -pix_fmt yuv420p "${partPath}" -y`;
                } else {
                    // No Audio: Loop image for default 8s
                    cmd = `ffmpeg -loop 1 -i "${seg.imagePath}" -t ${duration} -vf "scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,drawtext=text='${seg.text}':fontcolor=white:fontsize=48:x=(w-text_w)/2:y=h-400:box=1:boxcolor=black@0.5:boxborderw=10" -c:v libx264 -pix_fmt yuv420p "${partPath}" -y`;
                }

                console.log(`[CourseEngine] Rendering segment ${i}...`);
                await execAsync(cmd);
                tempFiles.push(partPath);
            }

            // 2. Concatenate all parts
            const outputFileName = `course_${courseId}_${Date.now()}.mp4`;
            const outputPath = path.join(this.UPLOADS_DIR, outputFileName);

            const concatListPath = path.join(workDir, "list.txt");
            const concatContent = tempFiles.map(f => `file '${f}'`).join("\n");
            await fs.writeFile(concatListPath, concatContent);

            console.log(`[CourseEngine] Concatenating ${tempFiles.length} segments...`);
            const concatCmd = `ffmpeg -f concat -safe 0 -i "${concatListPath}" -c copy "${outputPath}" -y`;
            await execAsync(concatCmd);

            return `/uploads/contents/${outputFileName}`;

        } catch (error: any) {
            console.error("🛑 [CourseEngine] FFmpeg Error:", error.message);
            throw new Error(`Fallo en el montaje de vídeo: ${error.message}`);
        } finally {
            // Cleanup
            await fs.rm(workDir, { recursive: true, force: true }).catch(() => { });
        }
    }
}
