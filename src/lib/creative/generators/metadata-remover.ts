import { exec } from 'child_process';
import { promisify } from 'util';
import { join, tmpdir } from 'path';
import { writeFileSync, readFileSync, unlinkSync } from 'fs';

const execAsync = promisify(exec);

export class MetadataRemover {
    static async stripVideo(buffer: Buffer, filename: string): Promise<Buffer> {
        const tmpIn  = join(tmpdir(), `in_${Date.now()}_${filename}`);
        const tmpOut = join(tmpdir(), `out_${Date.now()}_${filename}`);
        writeFileSync(tmpIn, buffer);
        await execAsync(
            `ffmpeg -i "${tmpIn}" -map_metadata -1 -c:v copy -c:a copy "${tmpOut}" -y`
        );
        const result = readFileSync(tmpOut);
        try { unlinkSync(tmpIn); unlinkSync(tmpOut); } catch {}
        return result;
    }

    static async stripImage(buffer: Buffer, filename: string): Promise<Buffer> {
        const tmpIn  = join(tmpdir(), `in_${Date.now()}_${filename}`);
        const tmpOut = join(tmpdir(), `out_${Date.now()}_${filename}`);
        writeFileSync(tmpIn, buffer);
        await execAsync(`ffmpeg -i "${tmpIn}" -map_metadata -1 "${tmpOut}" -y`);
        const result = readFileSync(tmpOut);
        try { unlinkSync(tmpIn); unlinkSync(tmpOut); } catch {}
        return result;
    }
}
