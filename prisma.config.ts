import { defineConfig } from '@prisma/config';
import path from 'path';

const dbPath = path.resolve(process.cwd(), 'prisma', 'dev.db');

export default defineConfig({
    datasource: {
        url: `file:${dbPath}`,
    },
});
