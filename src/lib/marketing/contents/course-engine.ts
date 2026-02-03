import { exec } from "child_process";
import { promisify } from "util";
import path from "path";
import fs from "fs/promises";

const execAsync = promisify(exec);

export class CourseEngine {
    private static UPLOADS_DIR = path.join(process.cwd(), "public", "uploads", "contents");

    /**
     * Assemblies a series of segments into a final MP4 mini-course.
     * Modo B: Optimized for CPU rendering (Mac M3).
     */
    static async assembleMiniCourse(courseId: string, segments: { imagePath: string, audioPath?: string, text: string }[]) {
        try {
            await fs.mkdir(this.UPLOADS_DIR, { recursive: true });
            const outputFileName = `course_${courseId}_${Date.now()}.mp4`;
            const outputPath = path.join(this.UPLOADS_DIR, outputFileName);

            // Simple FFmpeg command to loop an image for 8 seconds and overlay text
            // In a real production environment, this would be a loop of segments
            // For the MVP, we create a simple placeholder montage or use a complex filter

            // Placeholder: Just one segment for simplicity in this step
            const first = segments[0];
            const cmd = `ffmpeg -loop 1 -i "${first.imagePath}" -t 8 -vf "drawtext=text='${first.text}':fontcolor=white:fontsize=24:x=(w-text_w)/2:y=(h-text_h)/2" -c:v libx264 -pix_fmt yuv420p "${outputPath}" -y`;

            await execAsync(cmd);
            return `/uploads/contents/${outputFileName}`;
        } catch (error: any) {
            console.error("🛑 [CourseEngine] FFmpeg Error:", error.message);
            throw new Error(`Fallo en el montaje de vídeo: ${error.message}`);
        }
    }
}
