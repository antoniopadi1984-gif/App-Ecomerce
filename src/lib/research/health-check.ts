import { prisma } from '../prisma';
import { SearchOrchestrator } from './search-orchestrator';
import { DriveSync } from './drive-sync';

export interface HealthReport {
    timestamp: string;
    database: {
        status: 'OK' | 'ERROR';
        error?: string;
    };
    searchProviders: {
        exa: { status: 'OK' | 'MISSING' | 'ERROR'; error?: string };
        brave: { status: 'OK' | 'MISSING' | 'ERROR'; error?: string };
        tavily: { status: 'OK' | 'MISSING' | 'ERROR'; error?: string };
    };
    googleDrive: {
        status: 'OK' | 'ERROR' | 'OFFLINE';
        error?: string;
    };
}

export class HealthCheck {
    static async run(): Promise<HealthReport> {
        const report: HealthReport = {
            timestamp: new Date().toISOString(),
            database: { status: 'OK' },
            searchProviders: {
                exa: { status: process.env.EXA_API_KEY ? 'OK' : 'MISSING' },
                brave: { status: process.env.BRAVE_API_KEY ? 'OK' : 'MISSING' },
                tavily: { status: process.env.TAVILY_API_KEY ? 'OK' : 'MISSING' }
            },
            googleDrive: { status: 'OFFLINE' }
        };

        // 1. Database Check
        try {
            await prisma.$queryRaw`SELECT 1`;
        } catch (e: any) {
            report.database.status = 'ERROR';
            report.database.error = e.message;
        }

        // 2. Search Provider Connectivity (Minimal test)
        // We only test if keys are present for now, but we could do a small ping.

        // 3. Google Drive Service Account Check
        try {
            const drive = new DriveSync();
            // This might throw if no auth
            await (drive as any).getDrive();
            report.googleDrive.status = 'OK';
        } catch (e: any) {
            report.googleDrive.status = 'ERROR';
            report.googleDrive.error = e.message;
        }

        return report;
    }
}
